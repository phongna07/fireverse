import { CallLog } from "../../shared/types";
import { FC } from "react";
import { describeCall } from "../../calls/callLogic";
import { startCall } from "../../calls/callManager";
import { useCallStore } from "../../store/call";
import { useStore } from "../../store";

interface CallMessageProps {
  call: CallLog;
  conversationId: string;
  title: string;
}

const CallMessage: FC<CallMessageProps> = ({ call, conversationId, title }) => {
  const uid = useStore((state) => state.currentUser?.uid);
  const inCall = useCallStore((state) => state.phase !== "idle");
  const { title: heading, subtitle, isMissed } = describeCall(call, uid);
  const isVideo = call.callType === "video";
  const peerId = call.callerId === uid ? call.calleeId : call.callerId;

  return (
    <div
      title={title}
      onClick={(e) => e.stopPropagation()}
      className="flex max-w-[min(75%,320px)] flex-col overflow-hidden rounded-2xl bg-dark-lighten"
    >
      <div className="flex items-center gap-3 px-3 py-2">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-white ${
            isMissed ? "bg-red-500" : "bg-white/15"
          }`}
        >
          <i
            className={`bx ${
              isMissed
                ? isVideo
                  ? "bxs-video-off"
                  : "bx-phone-off"
                : isVideo
                  ? "bxs-video"
                  : "bxs-phone"
            }`}
          ></i>
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold">{heading}</p>
          <p className="text-sm text-gray-400">{subtitle}</p>
        </div>
      </div>
      <button
        type="button"
        disabled={inCall}
        onClick={() => void startCall(conversationId, peerId, call.callType)}
        className="border-t border-white/10 px-3 py-2 text-center font-semibold transition hover:bg-white/5 disabled:opacity-50"
      >
        {call.outcome === "completed" ? "Call again" : "Call back"}
      </button>
    </div>
  );
};

export default CallMessage;
