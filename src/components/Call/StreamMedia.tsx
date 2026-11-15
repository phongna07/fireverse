import { FC, useEffect, useRef } from "react";

interface StreamVideoProps {
  stream: MediaStream | null;
  mirrored?: boolean;
  className?: string;
}

// Always muted: remote audio plays through a single <RemoteAudio> element so
// it doesn't cut out when the video layout changes
export const StreamVideo: FC<StreamVideoProps> = ({
  stream,
  mirrored,
  className = "",
}) => {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream)
      ref.current.srcObject = stream;
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
      className={`${mirrored ? "-scale-x-100" : ""} ${className}`}
    />
  );
};

export const RemoteAudio: FC<{ stream: MediaStream | null }> = ({ stream }) => {
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = ref.current;
    if (!audio) return;
    if (audio.srcObject !== stream) audio.srcObject = stream;
    if (stream) void audio.play().catch(() => {});
  }, [stream]);

  return <audio ref={ref} autoPlay className="hidden" />;
};
