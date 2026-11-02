import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, categoryLabel, slugify } from "@/lib/portfolio";
import { getDbCollections, type DbCollection } from "@/lib/collections.functions";

export const Route = createFileRoute("/_authenticated/admin-collections")({
  head: () => ({ meta: [
    { title: "Manage Collections | Lunaray Studio" },
    { name: "description", content: "Private dashboard for managing Lunaray Studio photo collections." },
    { property: "og:title", content: "Manage Collections | Lunaray Studio" },
    { property: "og:description", content: "Private dashboard for managing Lunaray Studio photo collections." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: AdminCollections,
});

const CATS = CATEGORIES.filter((c) => c.value !== "all");
type Form = { title: string; category: string; description: string; date_label: string };
const EMPTY: Form = { title: "", category: "wedding", description: "", date_label: "" };

function AdminCollections() {
  const qc = useQueryClient();
  const role = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user?.id ?? "").eq("role", "admin");
      return (data?.length ?? 0) > 0;
    },
  });
  const cols = useQuery({ queryKey: ["db-collections"], enabled: role.data === true, queryFn: () => getDbCollections() });
  const [editing, setEditing] = useState<string | null>(null); // collection id or "new"
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["db-collections"] });

  if (role.isLoading) return <p className="px-5 pt-40 text-center">Loading…</p>;
  if (!role.data) return <p className="px-5 pt-40 text-center font-serif text-3xl text-forest">This account is not a studio administrator.</p>;

  const startEdit = (c?: DbCollection) => {
    setEditing(c?.id ?? "new");
    setForm(c ? { title: c.title, category: c.category, description: c.description, date_label: c.date_label ?? "" } : EMPTY);
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setBusy(true);
    const row = {
      title: form.title.trim(),
      category: form.category,
      description: form.description.trim(),
      date_label: form.date_label.trim() || null,
      slug: slugify(form.title),
    };
    const { error } = editing === "new"
      ? await supabase.from("portfolio_collections").insert(row)
      : await supabase.from("portfolio_collections").update(row).eq("id", editing!);
    setBusy(false);
    if (error) { toast.error(error.code === "23505" ? "A collection with this title already exists in that category." : error.message); return; }
    toast.success("Collection saved");
    setEditing(null);
    refresh();
  };

  const remove = async (c: DbCollection) => {
    if (!confirm(`Delete "${c.title}" and all its photos?`)) return;
    if (c.photos.length) await supabase.storage.from("portfolio").remove(c.photos.map((p) => p.storage_path));
    const { error } = await supabase.from("portfolio_collections").delete().eq("id", c.id);
    if (error) toast.error(error.message); else toast.success("Collection deleted");
    refresh();
  };

  const upload = async (c: DbCollection, files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    let order = c.photos.reduce((m, p) => Math.max(m, p.sort_order), 0);
    for (const f of Array.from(files)) {
      const path = `collections/${c.id}/${crypto.randomUUID()}.${f.name.split(".").pop() ?? "jpg"}`;
      const up = await supabase.storage.from("portfolio").upload(path, f, { contentType: f.type });
      if (up.error) { toast.error(`${f.name}: ${up.error.message}`); continue; }
      const { error } = await supabase.from("portfolio_photos").insert({
        collection_id: c.id, storage_path: path, category: c.category as never, alt: c.title, sort_order: ++order,
      });
      if (error) toast.error(error.message);
    }
    setBusy(false);
    toast.success("Photos uploaded");
    refresh();
  };

  const deletePhoto = async (path: string, id: string) => {
    await supabase.storage.from("portfolio").remove([path]);
    const { error } = await supabase.from("portfolio_photos").delete().eq("id", id);
    if (error) toast.error(error.message);
    refresh();
  };

  const makeCover = async (c: DbCollection, id: string) => {
    const min = Math.min(...c.photos.map((p) => p.sort_order));
    const { error } = await supabase.from("portfolio_photos").update({ sort_order: min - 1 }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Cover updated");
    refresh();
  };

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-32 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/admin" className="eyebrow text-primary">← Dashboard</Link>
          <h1 className="mt-2 font-serif text-5xl text-forest">Our Work Collections</h1>
        </div>
        <Button variant="brand" onClick={() => startEdit()}>New collection</Button>
      </div>

      {editing && (
        <div className="mt-8 grid gap-4 border border-border bg-card p-6 md:grid-cols-2">
          <label className="text-sm">Title<Input className="mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className="text-sm">Category
            <select className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>
          <label className="text-sm md:col-span-2">Description<Textarea className="mt-1" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label className="text-sm">Date (optional, e.g. March 2026)<Input className="mt-1" value={form.date_label} onChange={(e) => setForm({ ...form, date_label: e.target.value })} /></label>
          <div className="flex items-end gap-2">
            <Button variant="brand" disabled={busy} onClick={save}>Save</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="mt-10 space-y-8">
        {cols.isLoading && <p className="text-muted-foreground">Loading collections…</p>}
        {cols.data?.length === 0 && <p className="text-muted-foreground">No collections yet. Create one, then add photos.</p>}
        {cols.data?.map((c) => (
          <section key={c.id} className="border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow text-primary">{categoryLabel(c.category)}{c.date_label ? ` · ${c.date_label}` : ""}</p>
                <h2 className="font-serif text-3xl text-forest">{c.title}</h2>
                {c.description && <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{c.photos.length} photos {c.photos.length === 0 && "· hidden from the site until photos are added"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex h-9 cursor-pointer items-center rounded-md border border-input px-3 text-sm">
                  Add photos
                  <input type="file" accept="image/*" multiple className="hidden" disabled={busy} onChange={(e) => { upload(c, e.target.files); e.target.value = ""; }} />
                </label>
                <Button size="sm" variant="outline" onClick={() => startEdit(c)}>Edit</Button>
                <Button size="sm" variant="outline" onClick={() => remove(c)}>Delete</Button>
              </div>
            </div>
            {c.photos.length > 0 && (
              <div className="mt-5 grid grid-cols-3 gap-3 md:grid-cols-6">
                {c.photos.map((p, i) => (
                  <div key={p.id} className="group relative aspect-square overflow-hidden">
                    <img src={p.src} alt={p.alt} className="h-full w-full object-cover" />
                    {i === 0 && <span className="absolute left-1 top-1 bg-card px-1 text-[10px] uppercase">Cover</span>}
                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-card/90 p-1 text-[11px] opacity-0 transition group-hover:opacity-100">
                      {i !== 0 ? <button onClick={() => makeCover(c, p.id)}>Make cover</button> : <span />}
                      <button className="text-destructive" onClick={() => deletePhoto(p.storage_path, p.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
