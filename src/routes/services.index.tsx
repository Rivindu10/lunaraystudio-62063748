import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { ServiceCard } from "@/components/ServiceCard";
import { SERVICES } from "@/lib/site";
import { seo, breadcrumbs } from "@/lib/seo";

export const Route = createFileRoute("/services/")({
  head: () =>
    seo({
      title: "Photography Services | Lunaray Studio",
      description: "Graduation, birthday, wedding, engagement, event and casual shoot photography by Lunaray Studio. Explore our services and book your session.",
      path: "/services",
      jsonLd: breadcrumbs([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }]),
    }),
  component: Services,
});

function Services() {
  return (
    <>
      <PageHeader eyebrow="Services" title={<>Photography for life's <em>finest chapters</em></>} />
      <section className="mx-auto grid max-w-7xl gap-x-8 gap-y-16 px-5 py-24 sm:grid-cols-2 lg:grid-cols-3 md:px-8">
        {SERVICES.map((s, i) => <ServiceCard key={s.slug} service={s} index={i} />)}
      </section>
    </>
  );
}
