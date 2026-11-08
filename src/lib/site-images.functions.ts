import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { SitePhoto } from "./site-images";

// Short-lived server cache: several route loaders ask for site photos during
// a single page render, and visitors hit the same data repeatedly. 60s keeps
// admin photo replacements visible quickly while avoiding repeat DB + signing work.
let cache: { at: number; photos: SitePhoto[] } | undefined;
const CACHE_TTL_MS = 60_000;

export const getSitePhotos = createServerFn({ method: "GET" }).handler(async (): Promise<SitePhoto[]> => {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.photos;
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']!;
  const client = createClient<Database>(process.env['SUPABASE_URL']!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
  const { data, error } = await client.from("site_photos").select("image_key, storage_path, alt");
  if (error) throw new Error("Site photos could not be loaded.");
  if (!data?.length) return [];
  // Only sign files explicitly published in the publicly readable site-photo list.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: urls, error: signError } = await supabaseAdmin.storage.from("portfolio").createSignedUrls(data.map(p => p.storage_path), 3600 * 24);
  if (signError) throw new Error("Site photos could not be displayed.");
  const photos = data.flatMap((p, i) => {
    const signedUrl = urls?.[i]?.signedUrl;
    if (!signedUrl) return [];
    const url = new URL(signedUrl);
    const browserBase = new URL(import.meta.env['VITE_SUPABASE_URL']);
    url.host = browserBase.host;
    url.protocol = browserBase.protocol;
    return [{ ...p, src: url.toString() }];
  });
  cache = { at: Date.now(), photos };
  return photos;
});