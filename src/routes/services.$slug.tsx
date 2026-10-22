import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Gallery } from "@/components/Gallery";
import { serviceBySlug } from "@/lib/site";
import { SAMPLE_PHOTOS, fetchUploadedPhotos } from "@/lib/portfolio";
import { seo, breadcrumbs, serviceJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/services/$slug")({
  loader: ({ params }) => {
    const service = serviceBySlug(params.slug);
    if (!service) throw notFound();
    return { slug: service.slug, title: service.title, description: service.description };
  },
  head: ({ loaderData }) => {
    const service = loaderData ? serviceBySlug(loaderData.slug) : undefined;
    if (!loaderData || !service)
      return { meta: [{ title: "Service | Lunaray Studio" }, { name: "robots", content: "noindex" }] };
    const path = `/services/${loaderData.slug}`;
    return seo({
      title: `${loaderData.title} | Lunaray Studio`,
      description: loaderData.description,
      path,
      image: service.image,
      jsonLd: [
        serviceJsonLd(service),
        breadcrumbs([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: loaderData.title, path },
        ]),
      ],
    });
  },
  component: ServicePage,
});

function ServicePage() {
  const { slug } = Route.useLoaderData();
  const service = serviceBySlug(slug)!;
  const { data: uploaded = [] } = useQuery({ queryKey: ["portfolio"], queryFn: fetchUploadedPhotos });
  const photos = [...uploaded, ...SAMPLE_PHOTOS].filter((p) => p.category === slug);

  return (
    <>
      <section className="relative flex h-[75vh] min-h-[480px] items-end overflow-hidden">
        <img src={service.image} alt={service.title} className="absolute inset-0 h-full w-full animate-slow-zoom object-cover" />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 text-forest-foreground md:px-8">
          <Link to="/services" className="eyebrow text-lime">← All services</Link>
          <h1 className="mt-4 animate-fade-up font-serif text-5xl md:text-8xl">{service.title}</h1>
          <p className="mt-4 max-w-xl animate-fade-up opacity-90">{service.description}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 md:px-8">
        <Gallery photos={photos} />
      </section>

      <section className="bg-secondary/60 px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow text-center text-primary">Packages</p>
          <h2 className="mt-4 text-center font-serif text-4xl text-forest md:text-5xl">Choose your session</h2>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {service.packages.map((p) => (
              <div key={p.name} className="border border-border bg-card p-8">
                <h3 className="font-serif text-3xl text-forest">{p.name}</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{p.details}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button asChild variant="brand" size="xl"><Link to="/booking" search={{ service: slug }}>Book This Service</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}
