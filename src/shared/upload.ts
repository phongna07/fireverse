import configs, { UPLOADS_DISABLED_MESSAGE } from "./configs";
import { formatFileName } from "./utils";

// Load Firebase Storage on demand. Its chunk is never requested while
// uploads are disabled.
export const uploadToStorage = async (file: File) => {
  if (!configs.enableUploads) throw new Error(UPLOADS_DISABLED_MESSAGE);
  const [{ getStorage, ref, uploadBytes, getDownloadURL }, { firebaseApp }] =
    await Promise.all([import("firebase/storage"), import("./firebase")]);

  const fileReference = ref(getStorage(firebaseApp), formatFileName(file.name));

  await uploadBytes(fileReference, file);

  return getDownloadURL(fileReference);
};
