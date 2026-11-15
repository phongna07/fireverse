import { CallType } from "../shared/types";

export const getLocalMedia = (type: CallType) => {
  if (!navigator.mediaDevices?.getUserMedia)
    return Promise.reject(new Error("unsupported"));

  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video:
      type === "video"
        ? {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
        : false,
  });
};

export const mediaErrorMessage = (error: unknown, type: CallType) => {
  const devices = type === "video" ? "camera and microphone" : "microphone";
  const name = error instanceof Error ? error.name : "";

  if (error instanceof Error && error.message === "unsupported")
    return "Calls need a secure (HTTPS) connection and a supported browser.";
  if (name === "NotAllowedError" || name === "SecurityError")
    return `Allow access to your ${devices} to make calls.`;
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return `No ${devices} found.`;
  if (name === "NotReadableError")
    return `Your ${devices} may be in use by another app.`;
  return `Could not access your ${devices}.`;
};

export const getVideoInputs = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === "videoinput");
  } catch {
    return [];
  }
};
