import { describe, expect, it } from "vitest";
import { resolveSiteAlt, resolveSiteImage, SITE_IMAGE_SLOTS } from "@/lib/site-images";

describe("Administrator photo replacements", () => {
  it("replaces every registered page, service and bundled collection image", () => {
    for (const slot of SITE_IMAGE_SLOTS) {
      const photos = [{ image_key: slot.key, src: "https://example.com/replacement.jpg", alt: "New photograph", storage_path: "site/test.jpg" }];
      expect(resolveSiteImage(slot.src, photos)).toBe("https://example.com/replacement.jpg");
      expect(resolveSiteAlt(slot.src, "Original", photos)).toBe("New photograph");
    }
  });
  it("restores the original image when its replacement is removed", () => {
    for (const slot of SITE_IMAGE_SLOTS) expect(resolveSiteImage(slot.src, [])).toBe(slot.src);
  });
  it("does not override uploaded collection photos", () => {
    const src = "https://example.com/uploaded-collection.jpg";
    expect(resolveSiteImage(src, [{ image_key: "hero", src: "https://example.com/replacement.jpg", alt: "", storage_path: "site/test.jpg" }])).toBe(src);
  });
});