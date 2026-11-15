import { FC, ReactNode, useEffect, useState } from "react";
import { RemoteAudio, StreamVideo } from "./StreamMedia";
import {
  hangUp,
  setMinimized,
  switchCamera,
  toggleCamera,
  toggleMic,
} from "../../calls/callManager";
import { IMAGE_PROXY } from "../../shared/constants";
import { formatCallDuration } from "../../calls/callLogic";
import { useCallStore } from "../../store/call";
import { useShallow } from "zustand/react/shallow";
import { useUsersInfo } from "../../hooks/useUsersInfo";

const CallTimer: FC<{ connectedAt: number }> = ({ connectedAt }) => {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return <>{formatCallDuration((now - connectedAt) / 1000)}</>;
};

const CallStatus: FC = () => {
  const { phase, connectedAt, endedText, isCaller } = useCallStore(
    useShallow(({ phase, connectedAt, endedText, isCaller }) => ({
      phase,
      connectedAt,
      endedText,
      isCaller,
    })),
  );

  if (phase === "connected" && connectedAt)
    return <CallTimer connectedAt={connectedAt} />;
  if (phase === "ended") return <>{endedText}</>;
  if (phase === "ringing") return <>Calling…</>;
  if (phase === "starting")
    return <>{isCaller ? "Starting call…" : "Connecting…"}</>;
  return <>Connecting…</>;
};

interface ControlButtonProps {
  label: string;
  icon: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  small?: boolean;
  disabled?: boolean;
}

const ControlButton: FC<ControlButtonProps> = ({
  label,
  icon,
  onClick,
  active = true,
  danger,
  small,
  disabled,
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    aria-pressed={danger ? undefined : !active}
    disabled={disabled}
    onClick={onClick}
    className={`flex shrink-0 items-center justify-center rounded-full transition duration-200 hover:brightness-110 disabled:opacity-50 ${
      small ? "h-10 w-10 text-xl" : "h-14 w-14 text-2xl"
    } ${
      danger
        ? "bg-red-500 text-white"
        : active
          ? "bg-white/15 text-white"
          : "bg-white text-black"
    }`}
  >
    <i className={`bx ${icon}`}></i>
  </button>
);

const Avatar: FC<{ src?: string | null; size: string }> = ({ src, size }) => (
  <img
    className={`${size} shrink-0 rounded-full object-cover`}
    src={IMAGE_PROXY(src)}
    alt=""
  />
);

const CallOverlay: FC = () => {
  const state = useCallStore(
    useShallow((s) => ({
      phase: s.phase,
      peerId: s.peerId,
      type: s.type,
      localStream: s.localStream,
      remoteStream: s.remoteStream,
      micOn: s.micOn,
      cameraOn: s.cameraOn,
      remoteMicOn: s.remoteMicOn,
      remoteCameraOn: s.remoteCameraOn,
      canSwitchCamera: s.canSwitchCamera,
      minimized: s.minimized,
    })),
  );
  const { data: users } = useUsersInfo(state.peerId ? [state.peerId] : []);
  const peer = users?.[0];

  if (state.phase === "idle") return null;

  const isVideo = state.type === "video";
  const ended = state.phase === "ended";
  const showRemoteVideo =
    isVideo &&
    state.remoteCameraOn &&
    !!state.remoteStream?.getVideoTracks().length;
  const showLocalVideo = isVideo && state.cameraOn && !!state.localStream;
  const peerName = peer?.displayName || "Unknown user";

  const remoteView = (avatarSize: string, nameClass: string): ReactNode =>
    showRemoteVideo ? (
      <StreamVideo
        stream={state.remoteStream}
        className="absolute inset-0 h-full w-full bg-black object-contain"
      />
    ) : (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center">
        <Avatar src={peer?.photoURL} size={avatarSize} />
        <p className={`max-w-full truncate font-semibold ${nameClass}`}>
          {peerName}
        </p>
      </div>
    );

  return (
    <>
      <RemoteAudio stream={state.remoteStream} />

      {state.minimized ? (
        <div
          role="region"
          aria-label={`Call with ${peerName}`}
          className="fixed right-4 bottom-4 z-30 w-[220px] animate-fade-in overflow-hidden rounded-2xl border border-dark-lighten bg-[#111] shadow-2xl"
        >
          <button
            type="button"
            aria-label="Expand call"
            onClick={() => setMinimized(false)}
            className="relative block h-[140px] w-full"
          >
            {remoteView("h-14 w-14", "text-sm")}
          </button>
          <div className="flex items-center justify-between gap-2 p-2">
            <p className="truncate text-sm text-gray-300" aria-live="polite">
              <CallStatus />
            </p>
            <div className="flex gap-2">
              <ControlButton
                small
                label={state.micOn ? "Mute microphone" : "Unmute microphone"}
                icon={state.micOn ? "bxs-microphone" : "bxs-microphone-off"}
                active={state.micOn}
                onClick={toggleMic}
                disabled={ended}
              />
              <ControlButton
                small
                danger
                label="End call"
                icon="bxs-phone-off"
                onClick={hangUp}
                disabled={ended}
              />
            </div>
          </div>
        </div>
      ) : (
        <div
          role="dialog"
          aria-modal="false"
          aria-label={`Call with ${peerName}`}
          className="fixed inset-0 z-30 flex animate-fade-in flex-col bg-[#111]"
        >
          <div className="relative min-h-0 flex-1">
            {remoteView("h-28 w-28", "text-2xl")}

            <div className="absolute top-0 right-0 left-0 flex items-start justify-between gap-3 bg-gradient-to-b from-black/60 to-transparent p-4">
              <div className="min-w-0">
                {showRemoteVideo && (
                  <p className="truncate text-lg font-semibold">{peerName}</p>
                )}
                <p className="text-gray-300" aria-live="polite">
                  <CallStatus />
                  {!state.remoteMicOn && state.phase === "connected" && (
                    <span className="ml-2">
                      <i className="bx bxs-microphone-off align-middle"></i>{" "}
                      Muted
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                aria-label="Minimize call"
                title="Minimize call"
                onClick={() => setMinimized(true)}
                disabled={ended}
                className="icon-button text-white"
              >
                <i className="bx bx-exit-fullscreen text-2xl"></i>
              </button>
            </div>

            {isVideo && !ended && (
              <div className="absolute right-4 bottom-4 h-[160px] w-[120px] overflow-hidden rounded-xl border border-white/20 bg-dark shadow-lg md:h-[180px] md:w-[240px]">
                {showLocalVideo ? (
                  <StreamVideo
                    stream={state.localStream}
                    mirrored
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                    Camera off
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-center gap-4 px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <ControlButton
              label={state.micOn ? "Mute microphone" : "Unmute microphone"}
              icon={state.micOn ? "bxs-microphone" : "bxs-microphone-off"}
              active={state.micOn}
              onClick={toggleMic}
              disabled={ended}
            />
            {isVideo && (
              <ControlButton
                label={state.cameraOn ? "Turn camera off" : "Turn camera on"}
                icon={state.cameraOn ? "bxs-video" : "bxs-video-off"}
                active={state.cameraOn}
                onClick={toggleCamera}
                disabled={ended}
              />
            )}
            {isVideo && state.canSwitchCamera && (
              <ControlButton
                label="Switch camera"
                icon="bx-revision"
                onClick={() => void switchCamera()}
                disabled={ended || !state.cameraOn}
              />
            )}
            <ControlButton
              danger
              label="End call"
              icon="bxs-phone-off"
              onClick={hangUp}
              disabled={ended}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default CallOverlay;
