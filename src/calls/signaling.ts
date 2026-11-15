import {
  DocumentReference,
  Timestamp,
  addDoc,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  CandidateSide,
  callDoc,
  callsCollection,
  candidatesCollection,
  conversationDoc,
} from "../shared/collections";
import {
  CallData,
  CallLog,
  CallType,
  FirestoreTimestamp,
  SessionDescription,
} from "../shared/types";
import { EndReason, isCallAlive, isTerminal, resolveEnd } from "./callLogic";
import { db } from "../shared/firebase";

export { expiresInMs, isCallAlive, isTerminal } from "./callLogic";
export type { EndReason } from "./callLogic";

/** How long the caller waits for an answer */
export const RING_TIMEOUT_MS = 30_000;
// Slightly longer than the ring timeout, to tolerate clock differences
const RING_EXPIRY_MS = 40_000;
/** How often participants of an active call refresh `expiresAt` */
export const HEARTBEAT_MS = 30_000;
const ACTIVE_EXPIRY_MS = 90_000;

export class CallError extends Error {}

const expiryFromNow = (ms: number) => Timestamp.fromMillis(Date.now() + ms);

export const newCallRef = () => doc(callsCollection);

interface CreateCallInput {
  conversationId: string;
  type: CallType;
  callerId: string;
  calleeId: string;
  offer: SessionDescription;
}

export const createCall = (
  ref: DocumentReference<CallData>,
  input: CreateCallInput,
) => {
  const conversationRef = conversationDoc(input.conversationId);

  return runTransaction(db, async (transaction) => {
    const conversation = (await transaction.get(conversationRef)).data();
    if (
      !conversation ||
      !conversation.users.includes(input.callerId) ||
      !conversation.users.includes(input.calleeId)
    )
      throw new CallError("This conversation is unavailable.");

    // One call per conversation at a time. This also resolves both people
    // calling each other at the same moment: only one call is created.
    if (conversation.activeCall) {
      const active = (
        await transaction.get(callDoc(conversation.activeCall.callId))
      ).data();
      if (active && isCallAlive(active))
        throw new CallError("There is already a call in this conversation.");
    }

    const call: CallData = {
      ...input,
      participants: [input.callerId, input.calleeId],
      status: "ringing",
      answer: null,
      answeredBy: null,
      createdAt: serverTimestamp() as unknown as FirestoreTimestamp,
      expiresAt: expiryFromNow(RING_EXPIRY_MS),
    };

    transaction.set(ref, call);
    transaction.update(conversationRef, {
      activeCall: {
        callId: ref.id,
        type: input.type,
        callerId: input.callerId,
      },
    });
  });
};

/** Claims a ringing call for this tab. Fails if it was answered elsewhere. */
export const claimCall = (callId: string, uid: string, deviceId: string) =>
  runTransaction(db, async (transaction) => {
    const ref = callDoc(callId);
    const call = (await transaction.get(ref)).data();

    if (!call || call.status !== "ringing" || !isCallAlive(call))
      throw new CallError("This call is no longer available.");
    if (call.calleeId !== uid) throw new CallError("This call is not for you.");

    transaction.update(ref, {
      status: "accepted",
      answeredBy: { uid, deviceId },
      answeredAt: serverTimestamp(),
      expiresAt: expiryFromNow(ACTIVE_EXPIRY_MS),
    });

    return call;
  });

export const sendAnswer = (callId: string, answer: SessionDescription) =>
  updateDoc(callDoc(callId), { answer });

export const heartbeat = (callId: string) =>
  updateDoc(callDoc(callId), {
    expiresAt: expiryFromNow(ACTIVE_EXPIRY_MS),
  });

interface EndCallInput {
  callId: string;
  by: string;
  reason: EndReason;
  connected: boolean;
  durationSec: number;
}

/**
 * Moves a call to its final status, frees the conversation for new calls and
 * writes the call log message. Either participant may call this, possibly at
 * the same time: the transaction makes sure only the first one takes effect.
 */
export const endCall = (input: EndCallInput) =>
  runTransaction(db, async (transaction) => {
    const ref = callDoc(input.callId);
    const call = (await transaction.get(ref)).data();
    if (!call || isTerminal(call.status)) return;

    const conversationRef = conversationDoc(call.conversationId);
    const conversation = (await transaction.get(conversationRef)).data();

    const { status, outcome } = resolveEnd(
      call.status,
      input.reason,
      input.connected,
    );

    transaction.update(ref, {
      status,
      endedAt: serverTimestamp(),
      endedBy: input.by,
    });

    if (!conversation) return;

    transaction.update(conversationRef, {
      updatedAt: serverTimestamp(),
      ...(conversation.activeCall?.callId === input.callId
        ? { activeCall: null }
        : {}),
    });

    const log: CallLog = {
      callId: input.callId,
      callType: call.type,
      callerId: call.callerId,
      calleeId: call.calleeId,
      outcome,
      durationSec: outcome === "completed" ? input.durationSec : 0,
    };

    // The call id doubles as the message id, so a call is logged only once
    transaction.set(
      doc(db, "conversations", call.conversationId, "messages", input.callId),
      {
        sender: input.by,
        type: "call",
        content: "",
        call: log,
        replyTo: null,
        reactions: {},
        createdAt: serverTimestamp(),
      },
    );
  });

export const addCandidate = (
  callId: string,
  side: CandidateSide,
  candidate: RTCIceCandidate,
) =>
  addDoc(candidatesCollection(callId, side), {
    candidate: candidate.toJSON(),
    createdAt: serverTimestamp(),
  });

export const listenCandidates = (
  callId: string,
  side: CandidateSide,
  onCandidate: (candidate: RTCIceCandidateInit) => void,
) =>
  onSnapshot(
    candidatesCollection(callId, side),
    (snapshot) => {
      for (const change of snapshot.docChanges())
        if (change.type === "added") onCandidate(change.doc.data().candidate);
    },
    console.error,
  );

export const listenCall = (
  callId: string,
  onChange: (call: CallData) => void,
) =>
  onSnapshot(
    callDoc(callId),
    (snapshot) => {
      const call = snapshot.data();
      if (call) onChange(call);
    },
    console.error,
  );
