import hero from "@/assets/hero.jpg";
import graduation from "@/assets/graduation.jpg";
import birthday from "@/assets/birthday.jpg";
import wedding from "@/assets/wedding.jpg";
import engagement from "@/assets/engagement.jpg";
import events from "@/assets/events.jpg";
import about from "@/assets/about.jpg";
import { supabase } from "@/integrations/supabase/client";
import type { ServiceSlug } from "./site";

/** Portfolio categories: the bookable services plus portfolio-only ones. */
export type PortfolioCategory = ServiceSlug | "casual";

export interface Photo {
  id: string;
  src: string;
  alt: string;
  category: PortfolioCategory;
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

export const CATEGORIES: { value: PortfolioCategory | "all"; label: string }[] = [
  { value: "all", label: "All Work" },
  { value: "graduation", label: "Graduation" },
  { value: "birthday", label: "Birthdays" },
  { value: "wedding", label: "Weddings" },
  { value: "engagement", label: "Engagements" },
  { value: "events", label: "Events" },
  { value: "casual", label: "Casual Shoot" },
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
    alt: p.alt || "Lunaray Studio photograph",
    category: p.category,
  })).filter((p) => p.src);
}

/* -------------------------------------------------------------------------
 * Collections ("Our Work")
 *
 * Every collection lives in its own folder:
 *   src/assets/portfolio/<category>/<collection-folder>/<photos...>
 *
 * <category> must be one of: graduation, birthday, wedding, engagement, events, casual.
 * To add a collection, just create a new folder and drop photos in it — it
 * appears on the site automatically (photos are ordered by file name, and the
 * first one is the cover). Optionally add a nicer title / description / date
 * for it in COLLECTION_INFO below, keyed by "<category>/<collection-folder>".
 * ---------------------------------------------------------------------- */

export interface Collection {
  slug: string;
  category: PortfolioCategory;
  title: string;
  description: string;
  /** Free-text date shown on the card, e.g. "March 2026". */
  date?: string | undefined;
  cover: string;
  photos: Photo[];
}

export const COLLECTION_INFO: Record<string, { title?: string; description?: string; date?: string }> = {
  "wedding/olive-grove-wedding": {
    title: "Olive Grove Wedding",
    description: "A sunset ceremony among the olive trees — vows, bouquets and quiet moments.",
  },
  "graduation/class-of-2026": {
    title: "Class of 2026",
    description: "Caps, gowns and the proud smiles of graduation day.",
  },
  "engagement/golden-meadow": {
    title: "Golden Meadow Engagement",
    description: "A golden-hour session in tall grass, just the two of them.",
  },
  "birthday/garden-birthday": {
    title: "Garden Birthday",
    description: "Candles, laughter and string lights on a milestone birthday.",
  },
  "casual/everyday-moments": {
    title: "Everyday Moments",
    description: "Relaxed, natural shoots — no occasion needed, just you being you.",
  },
  "events/candlelit-evening": {
    title: "Candlelit Evening",
    description: "A relaxed garden reception lit by candles and good company.",
  },
};

const prettify = (folder: string) =>
  folder.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const COLLECTION_FILES = import.meta.glob<string>(
  "/src/assets/portfolio/*/*/*.{jpg,jpeg,png,webp,avif}",
  { eager: true, import: "default" },
);

const VALID_CATEGORIES: readonly string[] = ["graduation", "birthday", "wedding", "engagement", "events", "casual"];

function buildCollections(): Collection[] {
  const groups = new Map<string, { category: PortfolioCategory; folder: string; files: [string, string][] }>();
  for (const [path, url] of Object.entries(COLLECTION_FILES)) {
    const [category, folder] = path.replace("/src/assets/portfolio/", "").split("/");
    if (!category || !folder || !VALID_CATEGORIES.includes(category)) continue;
    const key = `${category}/${folder}`;
    const g = groups.get(key) ?? { category: category as PortfolioCategory, folder, files: [] };
    g.files.push([path, url]);
    groups.set(key, g);
  }
  return [...groups.entries()]
    .map(([key, g]) => {
      const info = COLLECTION_INFO[key] ?? {};
      const title = info.title ?? prettify(g.folder);
      const photos: Photo[] = g.files
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
        .map(([path, src], i) => ({ id: path, src, alt: `${title} — photo ${i + 1}`, category: g.category }));
      return {
        slug: g.folder,
        category: g.category,
        title,
        description: info.description ?? "",
        date: info.date,
        cover: photos[0]!.src,
        photos,
      } satisfies Collection;
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export const COLLECTIONS: Collection[] = buildCollections();

export const collectionsByCategory = (cat: PortfolioCategory | "all") =>
  cat === "all" ? COLLECTIONS : COLLECTIONS.filter((c) => c.category === cat);

export const findCollection = (category: string, slug: string) =>
  COLLECTIONS.find((c) => c.category === category && c.slug === slug);

export const categoryLabel = (cat: string) =>
  CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
