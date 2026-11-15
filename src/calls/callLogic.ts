import type {
  CallData,
  CallLog,
  CallOutcome,
  CallStatus,
  FirestoreTimestamp,
} from "../shared/types";

// Pure call logic, kept free of Firebase and runtime imports so it can be
// unit tested directly with Node.

export const toMillis = (timestamp?: FirestoreTimestamp | null) =>
  timestamp ? timestamp.seconds * 1000 + timestamp.nanoseconds / 1e6 : 0;

export const isTerminal = (status: CallStatus) =>
  status !== "ringing" && status !== "accepted";

/** Whether a call is still ringing or in progress (not abandoned) */
export const isCallAlive = (
  call: Pick<CallData, "status" | "expiresAt">,
  now = Date.now(),
) => !isTerminal(call.status) && toMillis(call.expiresAt) > now;

export const expiresInMs = (
  call: Pick<CallData, "expiresAt">,
  now = Date.now(),
) => toMillis(call.expiresAt) - now;

export type EndReason =
  "hangup" | "cancelled" | "missed" | "declined" | "busy" | "failed";

/** The final status and logged outcome when a call ends for `reason` */
export const resolveEnd = (
  current: CallStatus,
  reason: EndReason,
  connected: boolean,
): { status: CallStatus; outcome: CallOutcome } => {
  if (current === "ringing") {
    if (reason === "declined")
      return { status: "declined", outcome: "declined" };
    if (reason === "busy") return { status: "busy", outcome: "missed" };
    if (reason === "missed") return { status: "missed", outcome: "missed" };
    return { status: "cancelled", outcome: "missed" };
  }
  if (reason === "failed" && !connected)
    return { status: "failed", outcome: "failed" };
  return { status: "ended", outcome: "completed" };
};

/** Formats seconds as m:ss, or h:mm:ss for calls over an hour */
export const formatCallDuration = (totalSeconds: number) => {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(seconds % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
};

/** Text describing a call log, from the point of view of `uid` */
export const describeCall = (
  call: CallLog,
  uid?: string,
): { title: string; subtitle: string; isMissed: boolean } => {
  const kind = call.callType === "video" ? "Video" : "Audio";
  const isCaller = call.callerId === uid;

  switch (call.outcome) {
    case "completed":
      return {
        title: `${kind} call`,
        subtitle:
          call.durationSec > 0 ? formatCallDuration(call.durationSec) : "Ended",
        isMissed: false,
      };
    case "declined":
      return {
        title: `${kind} call`,
        subtitle: isCaller ? "Declined" : "You declined",
        isMissed: isCaller,
      };
    case "failed":
      return {
        title: `${kind} call`,
        subtitle: "Couldn't connect",
        isMissed: true,
      };
    default:
      return isCaller
        ? { title: `${kind} call`, subtitle: "No answer", isMissed: false }
        : {
            title: `Missed ${kind.toLowerCase()} call`,
            subtitle: "Unanswered",
            isMissed: true,
          };
  }
};
