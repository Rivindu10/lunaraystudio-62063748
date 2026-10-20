import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Gallery } from "@/components/Gallery";
import { CATEGORIES, SAMPLE_PHOTOS, fetchUploadedPhotos } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio | Lunaray Studio" },
      { name: "description", content: "Explore Lunaray Studio's portfolio of weddings, engagements, graduations, birthdays and events." },
      { property: "og:title", content: "Portfolio | Lunaray Studio" },
      { property: "og:description", content: "Cinematic, timeless photography — explore our work." },
    ],
  }),
  component: Portfolio,
});

function Portfolio() {
  const [cat, setCat] = useState<string>("all");
  const { data: uploaded = [] } = useQuery({ queryKey: ["portfolio"], queryFn: fetchUploadedPhotos });
  const all = [...uploaded, ...SAMPLE_PHOTOS];
  const photos = cat === "all" ? all : all.filter((p) => p.category === cat);

  return (
    <>
      <PageHeader eyebrow="Portfolio" title={<>Moments, <em>beautifully kept</em></>} />
      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <div role="tablist" className="mb-12 flex flex-wrap justify-center gap-x-8 gap-y-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              role="tab"
              aria-selected={cat === c.value}
              onClick={() => setCat(c.value)}
              className={cn("eyebrow border-b pb-2 transition", cat === c.value ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-forest")}
            >
              {c.label}
            </button>
          ))}
        </div>
        <Gallery key={cat} photos={photos} />
      </section>
    </>
  );
}
