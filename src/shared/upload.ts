import configs, { UPLOADS_DISABLED_MESSAGE } from "./configs";
import { uploadCloudinaryImage } from "./cloudinary";

export const uploadToStorage = async (file: File): Promise<string> => {
  if (!configs.enableUploads) throw new Error(UPLOADS_DISABLED_MESSAGE);
  return uploadCloudinaryImage(
    file,
    configs.cloudinaryCloudName,
    configs.cloudinaryUploadPreset,
  );
};
