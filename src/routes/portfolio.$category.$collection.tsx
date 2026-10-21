import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Gallery } from "@/components/Gallery";
import { categoryLabel, findCollection } from "@/lib/portfolio";
import { SERVICES } from "@/lib/site";

export const Route = createFileRoute("/portfolio/$category/$collection")({
  loader: ({ params }) => {
    const c = findCollection(params.category, params.collection);
    if (!c) throw notFound();
    return { category: c.category, slug: c.slug, title: c.title, description: c.description };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} | Lunaray Studio` },
          { name: "description", content: loaderData.description || `${loaderData.title} — a collection by Lunaray Studio.` },
          { property: "og:title", content: `${loaderData.title} | Lunaray Studio` },
        ]
      : [{ title: "Collection | Lunaray Studio" }, { name: "robots", content: "noindex" }],
  }),
  component: CollectionPage,
});

function CollectionPage() {
  const { category, slug } = Route.useLoaderData();
  const c = findCollection(category, slug)!;

  return (
    <>
      <section className="relative flex h-[65vh] min-h-[420px] items-end overflow-hidden">
        <img src={c.cover} alt={c.title} className="absolute inset-0 h-full w-full animate-slow-zoom object-cover" />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="relative mx-auto w-full max-w-7xl px-5 pb-14 text-forest-foreground md:px-8">
          <Link to="/portfolio" className="eyebrow text-lime">← All collections</Link>
          <p className="eyebrow mt-4 opacity-80">{categoryLabel(c.category)}{c.date ? ` · ${c.date}` : ""}</p>
          <h1 className="mt-2 animate-fade-up font-serif text-5xl md:text-8xl">{c.title}</h1>
          {c.description && <p className="mt-4 max-w-xl animate-fade-up opacity-90">{c.description}</p>}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <Gallery photos={c.photos} />
        <div className="mt-16 text-center">
          <Button asChild variant="brand" size="xl">
            <Link to="/booking" search={SERVICES.find((s) => s.slug === c.category) ? { service: c.category as never } : {}}>Book a Similar Session</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
