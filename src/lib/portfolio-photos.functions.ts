import { createServerFn } from "@tanstack/react-start";

/** Signs URLs only for photos listed in the public gallery table. */
export const getUploadedPhotoUrls = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("portfolio_photos")
    .select("id, storage_path, alt, category")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error || !data?.length) return [];
  const { data: signed } = await supabaseAdmin.storage
    .from("portfolio")
    .createSignedUrls(data.map((p) => p.storage_path), 60 * 60 * 24 * 7);
  return data
    .map((p, i) => ({
      id: p.id,
      src: signed?.[i]?.signedUrl ?? "",
      alt: p.alt || "Lunaray Studio photograph",
      category: p.category as string,
    }))
    .filter((p) => p.src);
});
