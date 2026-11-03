import hero from "@/assets/hero.jpg";
import about from "@/assets/about.jpg";
import graduation from "@/assets/graduation.jpg";
import birthday from "@/assets/birthday.jpg";
import wedding from "@/assets/wedding.jpg";
import engagement from "@/assets/engagement.jpg";
import events from "@/assets/events.jpg";

export interface SitePhoto { image_key: string; src: string; alt: string; storage_path: string }
export interface ImageSlot { key: string; src: string; label: string; group: string }
const collectionFiles = import.meta.glob<string>("/src/assets/portfolio/*/*/*.{jpg,jpeg,png,webp,avif}", { eager: true, import: "default" });
const prettify = (s: string) => s.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
export const SITE_IMAGE_SLOTS: ImageSlot[] = [
  { key: "hero", src: hero, label: "Home cover / selected wedding photo", group: "Page and service photos" },
  { key: "about", src: about, label: "Studio portrait — Home and About", group: "Page and service photos" },
  ...Object.entries({ graduation, birthday, wedding, engagement, events }).map(([key, src]) => ({ key, src, label: `${prettify(key)} — service and selected work`, group: "Page and service photos" })),
  ...Object.entries(collectionFiles).sort(([a], [b]) => a.localeCompare(b)).map(([path, src]) => {
    const parts = path.replace("/src/assets/portfolio/", "").split("/");
    return { key: path, src, label: parts[2] ?? "Photo", group: `${prettify(parts[0] ?? "")}: ${prettify(parts[1] ?? "")}` };
  }),
];
export function resolveSiteImage(src: string, photos: SitePhoto[]) {
  const slot = SITE_IMAGE_SLOTS.find(s => s.src === src);
  return slot ? photos.find(p => p.image_key === slot.key)?.src || src : src;
}
export function resolveSiteAlt(src: string, alt: string | undefined, photos: SitePhoto[]) {
  const slot = SITE_IMAGE_SLOTS.find(s => s.src === src);
  return (slot ? photos.find(p => p.image_key === slot.key)?.alt : undefined) || alt;
}