const cloudinaryCloudName = (
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || ""
).trim();
const cloudinaryUploadPreset = (
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ""
).trim();

// Optional JSON array of RTCIceServer, e.g. to add a TURN server later
const parseIceServers = (value?: string): RTCIceServer[] | null => {
  if (!value?.trim()) return null;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    console.error("VITE_ICE_SERVERS is not valid JSON; using default STUN");
    return null;
  }
};

const configs = {
  firebaseConfig: import.meta.env.VITE_FIREBASE_CONFIG as string,
  giphyAPIKey: import.meta.env.VITE_GIPHY_API_KEY as string,
  cloudinaryCloudName,
  cloudinaryUploadPreset,
  enableUploads: Boolean(cloudinaryCloudName && cloudinaryUploadPreset),
  iceServers: parseIceServers(import.meta.env.VITE_ICE_SERVERS) ?? [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
    },
  ],
};

export const UPLOADS_DISABLED_MESSAGE =
  "Image uploads are unavailable until Cloudinary is configured.";

export default configs;
