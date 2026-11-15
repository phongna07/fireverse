import { CallItem, CallType } from "../shared/types";
import { create } from "zustand";

export type CallPhase =
  | "idle"
  // Getting camera/microphone and creating the call
  | "starting"
  // Caller waiting for the callee to pick up
  | "ringing"
  // Picked up, peer connection being established
  | "connecting"
  | "connected"
  // Briefly shows how the call ended before returning to idle
  | "ended";

export interface CallState {
  phase: CallPhase;
  callId: string | null;
  conversationId: string | null;
  peerId: string | null;
  type: CallType;
  isCaller: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  micOn: boolean;
  cameraOn: boolean;
  remoteMicOn: boolean;
  remoteCameraOn: boolean;
  canSwitchCamera: boolean;
  connectedAt: number | null;
  endedText: string | null;
  minimized: boolean;
  /** Ringing calls for the current user, from any conversation */
  incoming: CallItem[];
}

export const initialCallState: Omit<CallState, "incoming"> = {
  phase: "idle",
  callId: null,
  conversationId: null,
  peerId: null,
  type: "audio",
  isCaller: false,
  localStream: null,
  remoteStream: null,
  micOn: true,
  cameraOn: true,
  remoteMicOn: true,
  remoteCameraOn: true,
  canSwitchCamera: false,
  connectedAt: null,
  endedText: null,
  minimized: false,
};

export const useCallStore = create<CallState>(() => ({
  ...initialCallState,
  incoming: [],
}));
