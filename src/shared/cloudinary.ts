export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export const validateImage = (file: File) => {
  if (!IMAGE_ACCEPT.split(",").includes(file.type)) {
    throw new Error("Choose a JPEG, PNG, WebP, or GIF image.");
  }
  if (file.size === 0) throw new Error("The image is empty.");
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Images must be 2 MB or smaller.");
  }
};

export const uploadCloudinaryImage = async (
  file: File,
  cloudName: string,
  uploadPreset: string,
): Promise<string> => {
  validateImage(file);
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", uploadPreset);

  let response: Response;
  try {
    response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
      { method: "POST", body, signal: AbortSignal.timeout(60_000) },
    );
  } catch {
    throw new Error(
      "Image upload failed. Check your connection and try again.",
    );
  }
  if (!response.ok) {
    throw new Error(
      response.status === 413
        ? "Images must be 2 MB or smaller."
        : "Image upload was rejected. Check your Cloudinary upload preset and try again.",
    );
  }
  const result = await response.json();
  if (
    result.resource_type !== "image" ||
    typeof result.secure_url !== "string" ||
    !result.secure_url.startsWith("https://res.cloudinary.com/")
  ) {
    throw new Error(
      "Cloudinary did not return a valid image URL. Please try again.",
    );
  }
  return result.secure_url;
};
