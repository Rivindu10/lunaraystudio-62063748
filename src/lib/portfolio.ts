import hero from "@/assets/hero.jpg";
import graduation from "@/assets/graduation.jpg";
import birthday from "@/assets/birthday.jpg";
import wedding from "@/assets/wedding.jpg";
import engagement from "@/assets/engagement.jpg";
import events from "@/assets/events.jpg";
import about from "@/assets/about.jpg";
import { supabase } from "@/integrations/supabase/client";
import type { ServiceSlug } from "./site";

export interface Photo {
  id: string;
  src: string;
  alt: string;
  category: ServiceSlug;
}

/**
 * Built-in sample photos. Photos uploaded in the admin dashboard are shown
 * first; these samples fill the gallery until real work is added.
 */
export const SAMPLE_PHOTOS: Photo[] = [
  { id: "s1", src: hero, alt: "Bride and groom walking through an olive grove at sunset", category: "wedding" },
  { id: "s2", src: graduation, alt: "Smiling graduate in cap and gown among green trees", category: "graduation" },
  { id: "s3", src: engagement, alt: "Couple embracing in a tall grass meadow at golden hour", category: "engagement" },
  { id: "s4", src: birthday, alt: "Woman laughing over her birthday cake under string lights", category: "birthday" },
  { id: "s5", src: wedding, alt: "Bride holding a bouquet of white roses and olive branches", category: "wedding" },
  { id: "s6", src: events, alt: "Guests at a candlelit garden evening reception", category: "events" },
  { id: "s7", src: about, alt: "Photographer framing a shot by the window", category: "events" },
];

export const CATEGORIES: { value: ServiceSlug | "all"; label: string }[] = [
  { value: "all", label: "All Work" },
  { value: "graduation", label: "Graduation" },
  { value: "birthday", label: "Birthdays" },
  { value: "wedding", label: "Weddings" },
  { value: "engagement", label: "Engagements" },
  { value: "events", label: "Events" },
];

export async function fetchUploadedPhotos(): Promise<Photo[]> {
  const { data, error } = await supabase
    .from("portfolio_photos")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error || !data?.length) return [];
  const { data: signed } = await supabase.storage
    .from("portfolio")
    .createSignedUrls(data.map((p) => p.storage_path), 60 * 60 * 24 * 7);
  return data.map((p, i) => ({
    id: p.id,
    src: signed?.[i]?.signedUrl ?? "",
    alt: p.alt || "Lunary Studio photograph",
    category: p.category,
  })).filter((p) => p.src);
}
