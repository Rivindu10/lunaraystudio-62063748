import { createServerFn } from "@tanstack/react-start";

export interface DbPhoto { id: string; src: string; alt: string; storage_path: string; sort_order: number }
export interface DbCollection {
  id: string;
  category: string;
  slug: string;
  title: string;
  description: string;
  date_label: string | null;
  photos: DbPhoto[];
}

// Short-lived server cache to avoid repeat DB + signing work on every page view.
let cache: { at: number; collections: DbCollection[] } | undefined;
const CACHE_TTL_MS = 60_000;

/** Public: lists admin-created collections with signed photo URLs. */
export const getDbCollections = createServerFn({ method: "GET" }).handler(async (): Promise<DbCollection[]> => {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.collections;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: cols, error } = await supabaseAdmin
    .from("portfolio_collections")
    .select("id, category, slug, title, description, date_label")
    .order("created_at", { ascending: false });
  if (error || !cols?.length) return [];
  const { data: photos } = await supabaseAdmin
    .from("portfolio_photos")
    .select("id, storage_path, alt, sort_order, collection_id")
    .not("collection_id", "is", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const list = photos ?? [];
  const signed = list.length
    ? (await supabaseAdmin.storage.from("portfolio").createSignedUrls(list.map((p) => p.storage_path), 60 * 60 * 24 * 7)).data
    : [];
  const withUrls = list.map((p, i) => ({ ...p, src: signed?.[i]?.signedUrl ?? "" }));
  const collections = cols.map((c) => ({
    ...c,
    photos: withUrls
      .filter((p) => p.collection_id === c.id && p.src)
      .map((p) => ({ id: p.id, src: p.src, alt: p.alt || c.title, storage_path: p.storage_path, sort_order: p.sort_order })),
  }));
  cache = { at: Date.now(), collections };
  return collections;
});
