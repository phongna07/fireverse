import { FC, useEffect, useId, useState } from "react";
import { acceptCall, declineCall } from "../../calls/callManager";
import { expiresInMs, isCallAlive } from "../../calls/signaling";
import { CallItem } from "../../shared/types";
import { IMAGE_PROXY } from "../../shared/constants";
import { playTone } from "../../calls/tones";
import { useCallStore } from "../../store/call";
import { useUsersInfo } from "../../hooks/useUsersInfo";

const IncomingCallCard: FC<{ call: CallItem }> = ({ call }) => {
  const titleId = useId();
  const { data: users } = useUsersInfo([call.callerId]);
  const caller = users?.[0];
  const name = caller?.displayName || "Someone";
  const isVideo = call.type === "video";

  useEffect(() => {
    const stopTone = playTone("ringtone");
    const title = document.title;
    document.title = `Incoming call from ${name}`;
    return () => {
      stopTone();
      document.title = title;
    };
  }, [name]);

  return (
    <div
      role="alertdialog"
      aria-labelledby={titleId}
      className="fixed top-4 left-1/2 z-40 w-[calc(100%-32px)] max-w-[360px] -translate-x-1/2 animate-fade-in rounded-2xl border border-dark-lighten bg-dark p-4 shadow-2xl"
    >
      <div className="flex items-center gap-3">
        <img
          className="h-12 w-12 shrink-0 rounded-full object-cover"
          src={IMAGE_PROXY(caller?.photoURL)}
          alt=""
        />
        <div className="min-w-0">
          <p id={titleId} className="truncate font-semibold">
            {name}
          </p>
          <p className="text-sm text-gray-400">
            Incoming {isVideo ? "video" : "audio"} call…
          </p>
        </div>
      </div>
      <div className="mt-4 flex justify-center gap-8">
        <button
          type="button"
          aria-label="Decline call"
          title="Decline"
          onClick={() => declineCall(call)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-2xl text-white transition hover:brightness-110"
        >
          <i className="bx bxs-phone-off"></i>
        </button>
        <button
          type="button"
          aria-label={`Accept ${isVideo ? "video" : "audio"} call`}
          title="Accept"
          onClick={() => void acceptCall(call)}
          className="flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-green-500 text-2xl text-white transition hover:brightness-110"
        >
          <i className={`bx ${isVideo ? "bxs-video" : "bxs-phone"}`}></i>
        </button>
      </div>
    </div>
  );
};

const IncomingCallDialog: FC = () => {
  const incoming = useCallStore((state) => state.incoming);
  const phase = useCallStore((state) => state.phase);
  // Re-renders when the shown call expires
  const [, setTick] = useState(0);

  const call =
    phase === "idle" ? incoming.find((item) => isCallAlive(item)) : undefined;

  useEffect(() => {
    if (!call) return;
    const timeout = window.setTimeout(
      () => setTick((tick) => tick + 1),
      Math.max(0, expiresInMs(call)) + 100,
    );
    return () => window.clearTimeout(timeout);
  }, [call]);

  if (!call) return null;
  return <IncomingCallCard key={call.id} call={call} />;
};

export default IncomingCallDialog;
