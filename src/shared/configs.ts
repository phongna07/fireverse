const cloudinaryCloudName = (
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || ""
).trim();
const cloudinaryUploadPreset = (
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ""
).trim();

const configs = {
  firebaseConfig: import.meta.env.VITE_FIREBASE_CONFIG as string,
  giphyAPIKey: import.meta.env.VITE_GIPHY_API_KEY as string,
  cloudinaryCloudName,
  cloudinaryUploadPreset,
  enableUploads: Boolean(cloudinaryCloudName && cloudinaryUploadPreset),
};

export const UPLOADS_DISABLED_MESSAGE =
  "Image uploads are unavailable until Cloudinary is configured.";

export default configs;
