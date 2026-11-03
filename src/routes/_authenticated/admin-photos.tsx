import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ImagePlus, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSitePhotos } from "@/lib/site-images.functions";
import { SITE_IMAGE_SLOTS, resolveSiteImage, type ImageSlot } from "@/lib/site-images";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin-photos")({
  head: () => seo({ title: "Manage Site Photos | Lunaray Studio", description: "Private Lunaray Studio page-cover and photo management.", path: "/admin-photos", noindex: true }),
  component: AdminPhotos,
});

function AdminPhotos() {
  const qc = useQueryClient();
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<ImageSlot | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const role = useQuery({ queryKey: ["is-admin"], queryFn: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data, error } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (error) throw error;
    return data === true;
  } });
  const photos = useQuery({ queryKey: ["site-photos"], queryFn: () => getSitePhotos() });
  const [alt, setAlt] = useState("");
  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["site-photos"] });
    await router.invalidate();
  };
  const replace = async (file: File | undefined) => {
    const slot = selected;
    if (!slot || !file || busy) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      toast.error("Choose a JPG, PNG, WebP or AVIF photo."); return;
    }
    setBusy(slot.key);
    const previous = photos.data?.find(p => p.image_key === slot.key);
    const extension = file.type.split("/")[1];
    const path = `site/${crypto.randomUUID()}.${extension}`;
    try {
      const { error: uploadError } = await supabase.storage.from("portfolio").upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      const { error } = await supabase.from("site_photos").upsert({ image_key: slot.key, storage_path: path, alt: alt.trim() || slot.label, updated_at: new Date().toISOString() });
      if (error) {
        await supabase.storage.from("portfolio").remove([path]);
        throw error;
      }
      await refresh();
      if (previous) await supabase.storage.from("portfolio").remove([previous.storage_path]);
      toast.success("Photo replaced");
      setSelected(null);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Photo could not be replaced."); }
    finally { setBusy(null); }
  };
  const restore = async (slot: ImageSlot) => {
    const previous = photos.data?.find(p => p.image_key === slot.key);
    if (!previous || !confirm(`Restore the original photo for ${slot.label}?`)) return;
    setBusy(slot.key);
    try {
      const { error } = await supabase.from("site_photos").delete().eq("image_key", slot.key);
      if (error) throw error;
      await refresh();
      await supabase.storage.from("portfolio").remove([previous.storage_path]);
      toast.success("Original photo restored");
    } catch { toast.error("Photo could not be restored."); }
    finally { setBusy(null); }
  };

  if (role.isPending) return <p className="px-5 pt-40 text-center">Loading…</p>;
  if (!role.data) return <p className="px-5 pt-40 text-center font-serif text-3xl text-forest">This account is not a studio administrator.</p>;
  const groups = [...new Set(SITE_IMAGE_SLOTS.map(s => s.group))];
  return <div className="mx-auto max-w-7xl px-5 pb-20 pt-32 md:px-8">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><Link to="/admin" className="eyebrow text-primary">← Dashboard</Link><h1 className="mt-2 font-serif text-5xl text-forest">Site Photos</h1></div>
      <Button asChild variant="outline"><Link to="/admin-collections">Manage Our Work</Link></Button>
    </div>
    <div className="mt-8"><label className="text-sm">Photo group<select value={filter} onChange={e => setFilter(e.target.value)} className="mt-2 block h-10 w-full max-w-md rounded-md border border-input bg-card px-3"><option value="all">All photos</option>{groups.map(g => <option key={g}>{g}</option>)}</select></label></div>
    {photos.isError && <p role="alert" className="mt-4 text-destructive">Photos could not be loaded. <Button variant="link" onClick={() => photos.refetch()}>Try again</Button></p>}
    {groups.filter(g => filter === "all" || g === filter).map(group => <section key={group} className="mt-12">
      <h2 className="border-b border-border pb-3 font-serif text-3xl text-forest">{group}</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{SITE_IMAGE_SLOTS.filter(s => s.group === group).map(slot => <article key={slot.key} className="overflow-hidden rounded-md border border-border bg-card">
        <img src={resolveSiteImage(slot.src, photos.data ?? [])} alt={slot.label} className="aspect-[4/3] w-full object-cover" />
        <div className="p-4"><h3 className="min-h-12 text-sm font-medium">{slot.label}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button disabled={busy !== null || photos.isPending || photos.isError} onClick={() => { setSelected(slot); setAlt(photos.data?.find(p => p.image_key === slot.key)?.alt ?? ""); }}><ImagePlus />Replace photo</Button>
            {photos.data?.some(p => p.image_key === slot.key) && <Button variant="outline" size="icon" title="Restore original photo" aria-label={`Restore original: ${slot.label}`} disabled={busy !== null} onClick={() => restore(slot)}><RotateCcw /></Button>}
          </div>
        </div>
      </article>)}</div>
    </section>)}
    {selected && <div role="dialog" aria-modal="true" aria-label="Replace photo" className="fixed inset-0 z-[60] flex items-center justify-center bg-overlay/80 p-5">
      <div className="w-full max-w-md rounded-md border border-border bg-card p-6">
        <h2 className="font-serif text-3xl text-forest">Replace photo</h2><p className="mt-2 text-sm text-muted-foreground">{selected.label}</p>
        <label className="mt-6 block text-sm">Photo description<Input value={alt} onChange={e => setAlt(e.target.value)} className="mt-2" /></label>
        <input ref={fileInput} type="file" aria-label="New photo" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={e => { replace(e.target.files?.[0]); e.target.value = ""; }} />
        <div className="mt-6 flex flex-wrap gap-3"><Button disabled={busy !== null} onClick={() => fileInput.current?.click()}>{busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}Choose photo</Button><Button variant="outline" disabled={busy !== null} onClick={() => setSelected(null)}>Cancel</Button></div>
      </div>
    </div>}
  </div>;
}