import { createContext, useContext, type ComponentProps } from "react";
import { resolveSiteAlt, resolveSiteImage, type SitePhoto } from "@/lib/site-images";

export const SitePhotosContext = createContext<SitePhoto[]>([]);
export function SiteImage({ src, alt, ...props }: ComponentProps<"img">) {
  const photos = useContext(SitePhotosContext);
  const original = typeof src === "string" ? src : "";
  return <img {...props} src={resolveSiteImage(original, photos)} alt={resolveSiteAlt(original, alt, photos)} />;
}