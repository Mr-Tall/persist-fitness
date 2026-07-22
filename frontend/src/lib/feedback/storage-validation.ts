export const MAX_SCREENSHOT_BYTES = 3 * 1024 * 1024;
export const feedbackScreenshotTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export function validateScreenshot(file: File) {
  if (!feedbackScreenshotTypes.has(file.type)) {
    throw new Error("Screenshot must be a JPEG, PNG, or WebP image.");
  }
  if (file.size > MAX_SCREENSHOT_BYTES) {
    throw new Error("Screenshot must be 3 MB or smaller.");
  }
  const normalizedExtension = feedbackScreenshotTypes.get(file.type)!;
  const suppliedExtension = file.name.split(".").pop()?.toLowerCase();
  const validExtension =
    suppliedExtension === normalizedExtension ||
    (file.type === "image/jpeg" && suppliedExtension === "jpeg");
  if (!validExtension) {
    throw new Error("Screenshot file extension does not match its image type.");
  }
  return normalizedExtension;
}
