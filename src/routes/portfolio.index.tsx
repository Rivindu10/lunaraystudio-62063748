import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { CollectionCard } from "@/components/CollectionCard";
import { CATEGORIES, COLLECTIONS, collectionsByCategory } from "@/lib/portfolio";
import { cn } from "@/lib/utils";
import { seo, breadcrumbs } from "@/lib/seo";

export const Route = createFileRoute("/portfolio/")({
  head: () =>
    seo({
      title: "Our Work | Lunaray Studio",
      description: "Browse Lunaray Studio's collections of weddings, engagements, graduations, birthdays, events and casual shoots — memories we've captured.",
      path: "/portfolio",
      jsonLd: breadcrumbs([{ name: "Home", path: "/" }, { name: "Our Work", path: "/portfolio" }]),
    }),
  component: OurWork,
});

function OurWork() {
  const [cat, setCat] = useState<string>("all");
  const collections = collectionsByCategory(cat as never);
  // Only show category tabs that actually have collections (plus "All").
  const tabs = CATEGORIES.filter((c) => c.value === "all" || COLLECTIONS.some((x) => x.category === c.value));

  return (
    <>
      <PageHeader eyebrow="Our Work" title={<>Our work, <em>your memories</em></>}>
        <p>Every celebration has its own story. Browse our collections by occasion.</p>
      </PageHeader>
      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <div role="tablist" className="mb-12 flex flex-wrap justify-center gap-x-8 gap-y-3">
          {tabs.map((c) => (
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
        {collections.length ? (
          <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => (
              <CollectionCard key={`${c.category}/${c.slug}`} collection={c} />
            ))}
          </div>
        ) : (
          <p className="py-20 text-center text-muted-foreground">No collections here yet — check back soon.</p>
        )}
      </section>
    </>
  );
}
