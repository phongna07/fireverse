import {
  CallError,
  EndReason,
  HEARTBEAT_MS,
  RING_TIMEOUT_MS,
  addCandidate,
  claimCall,
  createCall,
  endCall,
  heartbeat,
  isCallAlive,
  isTerminal,
  listenCall,
  listenCandidates,
  newCallRef,
  sendAnswer,
} from "./signaling";
import {
  CallData,
  CallItem,
  CallStatus,
  CallType,
  SessionDescription,
} from "../shared/types";
import { getLocalMedia, getVideoInputs, mediaErrorMessage } from "./media";
import { initialCallState, useCallStore } from "../store/call";
import { CandidateSide } from "../shared/collections";
import { auth } from "../shared/firebase";
import configs from "../shared/configs";
import { playTone } from "./tones";
import { toast } from "../store/toast";

// Identifies this tab, so a user's other tabs know who picked up
const deviceId =
  globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);

// Without a TURN server, an unreachable peer usually fails sooner than this
const CONNECT_TIMEOUT_MS = 30_000;
// A dropped connection may recover by itself (e.g. switching Wi-Fi networks)
const DISCONNECT_GRACE_MS = 10_000;
const ENDED_DISPLAY_MS = 2_000;

type ControlMessage =
  { t: "bye" } | { t: "media"; mic: boolean; camera: boolean };

const setCallState = useCallStore.setState;
const getCallState = useCallStore.getState;

const resetCallState = () => setCallState({ ...initialCallState });

const stopStream = (stream: MediaStream | null) =>
  stream?.getTracks().forEach((track) => track.stop());

const describe = (description: RTCSessionDescriptionInit) =>
  ({
    type: description.type,
    sdp: description.sdp ?? "",
  }) satisfies SessionDescription;

const remoteEndText = (status: CallStatus, isCaller: boolean) => {
  switch (status) {
    case "declined":
      return "Call declined";
    case "busy":
      return "Line busy";
    case "missed":
      return isCaller ? "No answer" : "Missed call";
    case "cancelled":
      return isCaller ? "Call ended" : "Call cancelled";
    case "failed":
      return "Couldn't connect";
    default:
      return "Call ended";
  }
};

const localEndText = (reason: EndReason, connected: boolean) => {
  if (reason === "missed") return "No answer";
  if (reason === "failed")
    return connected ? "Connection lost" : "Couldn't connect";
  return "Call ended";
};

let current: CallSession | null = null;

class CallSession {
  readonly pc: RTCPeerConnection;
  private readonly remoteStream = new MediaStream();
  private control: RTCDataChannel | null = null;
  private unsubscribers: (() => void)[] = [];
  private localCandidates: RTCIceCandidate[] = [];
  private remoteCandidates: RTCIceCandidateInit[] = [];
  private signalingReady = false;
  private remoteDescriptionSet = false;
  private applyingAnswer = false;
  private stopTone: (() => void) | null = null;
  private ringTimer?: number;
  private connectTimer?: number;
  private disconnectTimer?: number;
  private heartbeatTimer?: number;
  accepted = false;
  connectedAt: number | null = null;
  ended = false;

  constructor(
    readonly callId: string,
    readonly uid: string,
    readonly isCaller: boolean,
    public localStream: MediaStream,
  ) {
    this.pc = new RTCPeerConnection({ iceServers: configs.iceServers });

    for (const track of localStream.getTracks())
      this.pc.addTrack(track, localStream);

    this.pc.onicecandidate = ({ candidate }) => {
      if (!candidate || this.ended) return;
      if (this.signalingReady) this.publishCandidate(candidate);
      else this.localCandidates.push(candidate);
    };

    this.pc.ontrack = ({ track }) => {
      this.remoteStream.addTrack(track);
      // A new stream object makes React re-attach it to media elements
      setCallState({
        remoteStream: new MediaStream(this.remoteStream.getTracks()),
      });
    };

    this.pc.onconnectionstatechange = () => this.handleConnectionState();

    // A data channel carries hang-up and mute/camera state directly between
    // peers. Its closing is also the fastest sign that the other tab is gone.
    if (isCaller) this.setupControl(this.pc.createDataChannel("control"));
    else this.pc.ondatachannel = ({ channel }) => this.setupControl(channel);
  }

  private get localSide(): CandidateSide {
    return this.isCaller ? "callerCandidates" : "calleeCandidates";
  }

  private get remoteSide(): CandidateSide {
    return this.isCaller ? "calleeCandidates" : "callerCandidates";
  }

  private publishCandidate(candidate: RTCIceCandidate) {
    addCandidate(this.callId, this.localSide, candidate).catch(console.error);
  }

  async createOffer() {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return describe(offer);
  }

  async createAnswer(offer: SessionDescription) {
    await this.setRemoteDescription(offer);
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return describe(answer);
  }

  private async setRemoteDescription(description: SessionDescription) {
    await this.pc.setRemoteDescription(description);
    this.remoteDescriptionSet = true;
    for (const candidate of this.remoteCandidates)
      this.pc.addIceCandidate(candidate).catch(console.error);
    this.remoteCandidates = [];
  }

  private addRemoteCandidate(candidate: RTCIceCandidateInit) {
    if (this.ended) return;
    // Candidates can only be applied after the remote description
    if (!this.remoteDescriptionSet) this.remoteCandidates.push(candidate);
    else this.pc.addIceCandidate(candidate).catch(console.error);
  }

  /** Starts exchanging candidates. Call once the call document exists. */
  startSignaling() {
    this.signalingReady = true;
    for (const candidate of this.localCandidates)
      this.publishCandidate(candidate);
    this.localCandidates = [];

    this.unsubscribers.push(
      listenCandidates(this.callId, this.remoteSide, (candidate) =>
        this.addRemoteCandidate(candidate),
      ),
      listenCall(this.callId, (call) => this.handleCallUpdate(call)),
    );
  }

  /** Caller only: waits for the callee to pick up */
  startRinging() {
    setCallState({ phase: "ringing" });
    this.stopTone = playTone("ringback");
    this.ringTimer = window.setTimeout(() => {
      if (!this.accepted) void this.end("missed");
    }, RING_TIMEOUT_MS);
  }

  markAccepted() {
    if (this.accepted || this.ended) return;
    this.accepted = true;
    this.stopTone?.();
    this.stopTone = null;
    window.clearTimeout(this.ringTimer);

    if (!this.connectedAt) setCallState({ phase: "connecting" });

    this.connectTimer = window.setTimeout(() => {
      if (!this.connectedAt) void this.end("failed");
    }, CONNECT_TIMEOUT_MS);

    // Keeps the call from looking abandoned to other clients
    this.heartbeatTimer = window.setInterval(
      () => heartbeat(this.callId).catch(console.error),
      HEARTBEAT_MS,
    );
  }

  private handleCallUpdate(call: CallData) {
    if (this.ended) return;

    if (isTerminal(call.status)) {
      this.finish(remoteEndText(call.status, this.isCaller));
      return;
    }

    if (!this.isCaller || call.status !== "accepted") return;

    this.markAccepted();

    if (call.answer && !this.applyingAnswer) {
      this.applyingAnswer = true;
      this.setRemoteDescription(call.answer).catch((error) => {
        console.error(error);
        void this.end("failed");
      });
    }
  }

  private handleConnectionState() {
    if (this.ended) return;

    switch (this.pc.connectionState) {
      case "connected":
        window.clearTimeout(this.disconnectTimer);
        this.disconnectTimer = undefined;
        if (!this.connectedAt) {
          this.connectedAt = Date.now();
          window.clearTimeout(this.connectTimer);
          setCallState({ phase: "connected", connectedAt: this.connectedAt });
        }
        break;
      case "disconnected":
        this.disconnectTimer ??= window.setTimeout(
          () => void this.end("failed"),
          DISCONNECT_GRACE_MS,
        );
        break;
      case "failed":
        void this.end("failed");
        break;
    }
  }

  private setupControl(channel: RTCDataChannel) {
    this.control = channel;

    channel.onopen = () => this.sendMediaState();

    channel.onmessage = ({ data }) => {
      let message: ControlMessage;
      try {
        message = JSON.parse(data);
      } catch {
        return;
      }

      if (message.t === "bye") void this.end("hangup", true);
      else if (message.t === "media")
        setCallState({
          remoteMicOn: Boolean(message.mic),
          remoteCameraOn: Boolean(message.camera),
        });
    };

    channel.onclose = () => {
      if (!this.ended && this.connectedAt) void this.end("hangup", true);
    };
  }

  private sendControl(message: ControlMessage) {
    if (this.control?.readyState !== "open") return false;
    try {
      this.control.send(JSON.stringify(message));
      return true;
    } catch {
      return false;
    }
  }

  sendMediaState() {
    const { micOn, cameraOn } = getCallState();
    this.sendControl({ t: "media", mic: micOn, camera: cameraOn });
  }

  /**
   * Ends the call from this side: tells the peer, releases devices and
   * records the result. `remote` is set when the peer has already hung up.
   */
  async end(reason: EndReason, remote = false) {
    if (this.ended) return;

    const sentBye = !remote && this.sendControl({ t: "bye" });
    const connected = this.connectedAt !== null;
    const durationSec = connected
      ? Math.round((Date.now() - (this.connectedAt as number)) / 1000)
      : 0;

    if (reason === "failed" && !connected)
      toast.error(
        "Couldn't connect the call. The network may be blocking a direct connection.",
      );

    this.finish(localEndText(reason, connected), sentBye);

    try {
      await endCall({
        callId: this.callId,
        by: this.uid,
        reason,
        connected,
        durationSec,
      });
    } catch (error) {
      console.error(error);
    }
  }

  /** Stops everything locally and shows how the call ended */
  private finish(text: string, flushControl = false) {
    if (this.ended) return;
    this.ended = true;
    this.dispose(flushControl);
    if (current === this) current = null;

    const { callId } = this;
    setCallState({
      phase: "ended",
      endedText: text,
      localStream: null,
      remoteStream: null,
      minimized: false,
    });
    window.setTimeout(() => {
      const state = getCallState();
      if (state.phase === "ended" && state.callId === callId) resetCallState();
    }, ENDED_DISPLAY_MS);
  }

  /** Releases all resources. `flushControl` gives a sent "bye" time to leave. */
  dispose(flushControl = false) {
    this.ended = true;
    this.stopTone?.();
    window.clearTimeout(this.ringTimer);
    window.clearTimeout(this.connectTimer);
    window.clearTimeout(this.disconnectTimer);
    window.clearInterval(this.heartbeatTimer);
    for (const unsubscribe of this.unsubscribers) unsubscribe();
    this.unsubscribers = [];

    // Turn the camera light off right away
    stopStream(this.localStream);

    this.pc.onicecandidate = null;
    this.pc.ontrack = null;
    this.pc.onconnectionstatechange = null;
    this.pc.ondatachannel = null;
    if (this.control) {
      this.control.onclose = null;
      this.control.onmessage = null;
    }

    const close = () => {
      this.control?.close();
      this.pc.close();
    };
    if (flushControl) window.setTimeout(close, 500);
    else close();
  }

  async switchCamera() {
    const inputs = await getVideoInputs();
    const oldTrack = this.localStream.getVideoTracks()[0];
    if (inputs.length < 2 || !oldTrack) return;

    const currentId = oldTrack.getSettings().deviceId;
    const next =
      inputs[
        (inputs.findIndex((d) => d.deviceId === currentId) + 1) % inputs.length
      ];

    // Phones often can't open two cameras at once: release the current one first
    oldTrack.stop();

    let newTrack: MediaStreamTrack;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: next.deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      newTrack = stream.getVideoTracks()[0];
    } catch (error) {
      console.error(error);
      toast.error("Could not switch the camera.");
      return;
    }

    if (this.ended) {
      newTrack.stop();
      return;
    }

    newTrack.enabled = getCallState().cameraOn;
    const sender = this.pc
      .getSenders()
      .find((s) => s.track?.kind === "video" || s.track === oldTrack);
    await sender?.replaceTrack(newTrack);

    this.localStream.removeTrack(oldTrack);
    this.localStream.addTrack(newTrack);
    setCallState({
      localStream: new MediaStream(this.localStream.getTracks()),
    });
  }
}

const updateCameraSwitch = async (type: CallType) => {
  if (type !== "video") return;
  const inputs = await getVideoInputs();
  setCallState({ canSwitchCamera: inputs.length > 1 });
};

/** Whether `callId` is still the call this tab is setting up */
const isStillSettingUp = (callId: string | null) => {
  const state = getCallState();
  return (
    (state.phase === "starting" || state.phase === "connecting") &&
    state.callId === callId
  );
};

export const startCall = async (
  conversationId: string,
  peerId: string,
  type: CallType,
) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  if (getCallState().phase !== "idle") {
    toast.info("You are already in a call.");
    return;
  }

  setCallState({
    ...initialCallState,
    phase: "starting",
    conversationId,
    peerId,
    type,
    isCaller: true,
    cameraOn: type === "video",
  });

  let stream: MediaStream;
  try {
    stream = await getLocalMedia(type);
  } catch (error) {
    resetCallState();
    toast.error(mediaErrorMessage(error, type));
    return;
  }

  // Hung up while waiting for the permission prompt
  if (!isStillSettingUp(null)) {
    stopStream(stream);
    return;
  }

  const ref = newCallRef();
  const session = new CallSession(ref.id, uid, true, stream);
  current = session;
  setCallState({ callId: ref.id, localStream: stream });
  void updateCameraSwitch(type);

  try {
    const offer = await session.createOffer();
    await createCall(ref, {
      conversationId,
      type,
      callerId: uid,
      calleeId: peerId,
      offer,
    });
  } catch (error) {
    console.error(error);
    session.dispose();
    if (current === session) current = null;
    resetCallState();
    toast.error(
      error instanceof CallError
        ? error.message
        : "Could not start the call. Please try again.",
    );
    return;
  }

  // Hung up while the call was being created
  if (session.ended) {
    endCall({
      callId: ref.id,
      by: uid,
      reason: "cancelled",
      connected: false,
      durationSec: 0,
    }).catch(console.error);
    return;
  }

  session.startSignaling();
  session.startRinging();
};

export const acceptCall = async (call: CallItem) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  if (getCallState().phase !== "idle") {
    toast.info("You are already in a call.");
    return;
  }

  setCallState({
    ...initialCallState,
    phase: "connecting",
    callId: call.id,
    conversationId: call.conversationId,
    peerId: call.callerId,
    type: call.type,
    isCaller: false,
    cameraOn: call.type === "video",
  });

  let stream: MediaStream;
  try {
    stream = await getLocalMedia(call.type);
  } catch (error) {
    // The call keeps ringing, so the user can fix permissions and retry
    resetCallState();
    toast.error(mediaErrorMessage(error, call.type));
    return;
  }

  if (!isStillSettingUp(call.id)) {
    stopStream(stream);
    return;
  }

  try {
    await claimCall(call.id, uid, deviceId);
  } catch (error) {
    console.error(error);
    stopStream(stream);
    resetCallState();
    toast.error(
      error instanceof CallError
        ? error.message
        : "Could not answer the call. Please try again.",
    );
    return;
  }

  const session = new CallSession(call.id, uid, false, stream);
  current = session;
  setCallState({ localStream: stream });
  void updateCameraSwitch(call.type);

  // Hung up while the call was being claimed
  if (!isStillSettingUp(call.id)) {
    void session.end("hangup");
    return;
  }

  try {
    const answer = await session.createAnswer(call.offer);
    await sendAnswer(call.id, answer);
  } catch (error) {
    console.error(error);
    void session.end("failed");
    return;
  }

  session.startSignaling();
  session.markAccepted();
};

export const declineCall = (call: CallItem, reason: EndReason = "declined") => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  endCall({
    callId: call.id,
    by: uid,
    reason,
    connected: false,
    durationSec: 0,
  }).catch((error) => {
    console.error(error);
    if (reason === "declined") toast.error("Could not decline the call.");
  });
};

export const hangUp = () => {
  if (current) {
    void current.end("hangup");
    return;
  }
  // Still waiting for devices or for the call to be created/claimed
  const { phase } = getCallState();
  if (phase === "starting" || phase === "connecting") resetCallState();
};

export const toggleMic = () => {
  const micOn = !getCallState().micOn;
  current?.localStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = micOn));
  setCallState({ micOn });
  current?.sendMediaState();
};

export const toggleCamera = () => {
  const cameraOn = !getCallState().cameraOn;
  current?.localStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = cameraOn));
  setCallState({ cameraOn });
  current?.sendMediaState();
};

export const switchCamera = () => current?.switchCamera();

export const setMinimized = (minimized: boolean) => setCallState({ minimized });

const busyDeclined = new Set<string>();

/** Receives the ringing calls addressed to the current user */
export const handleIncomingCalls = (calls: CallItem[]) => {
  const alive = calls.filter((call) => isCallAlive(call));
  setCallState({ incoming: alive });

  // Already talking in this tab: tell other callers the line is busy
  const { phase, callId } = getCallState();
  if (!current || !["ringing", "connecting", "connected"].includes(phase))
    return;
  for (const call of alive) {
    if (call.id === callId || busyDeclined.has(call.id)) continue;
    busyDeclined.add(call.id);
    declineCall(call, "busy");
  }
};

/** Ends any call, e.g. when signing out */
export const endActiveCall = () => {
  hangUp();
  setCallState({ incoming: [] });
};

window.addEventListener("pagehide", () => {
  // Best effort: the "bye" reaches the peer even if the write doesn't finish
  if (current) void current.end("hangup");
});

window.addEventListener("beforeunload", (event) => {
  if (current && !current.ended) {
    event.preventDefault();
    event.returnValue = "";
  }
});
