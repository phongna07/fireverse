const configs = {
  firebaseConfig: import.meta.env.VITE_FIREBASE_CONFIG as string,
  giphyAPIKey: import.meta.env.VITE_GIPHY_API_KEY as string,
  // Image/file upload needs Firebase Storage, which is no longer free.
  // Set VITE_ENABLE_UPLOADS=true once the Firebase project has Storage enabled.
  enableUploads: import.meta.env.VITE_ENABLE_UPLOADS === "true",
};

export const UPLOADS_DISABLED_MESSAGE =
  "Image and file upload is unavailable: Firebase Storage is not enabled for this app.";

export default configs;
