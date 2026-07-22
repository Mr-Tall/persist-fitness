import { describe, expect, it } from "vitest";
import { MAX_SCREENSHOT_BYTES, validateScreenshot } from "./storage-validation";

describe("feedback screenshot validation", () => {
  it.each([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]])("accepts %s", (type, extension) => {
    expect(() => validateScreenshot(new File(["image"], `image.${extension}`, { type }))).not.toThrow();
  });
  it("rejects executable and oversized files", () => {
    expect(() => validateScreenshot(new File(["svg"], "image.svg", { type: "image/svg+xml" }))).toThrow(/JPEG/);
    const oversized = new File([new Uint8Array(MAX_SCREENSHOT_BYTES + 1)], "large.png", { type: "image/png" });
    expect(() => validateScreenshot(oversized)).toThrow(/3 MB/);
  });
  it("rejects a mismatched extension", () => {
    expect(() => validateScreenshot(new File(["image"], "image.png", { type: "image/jpeg" }))).toThrow(/extension/);
  });
});
