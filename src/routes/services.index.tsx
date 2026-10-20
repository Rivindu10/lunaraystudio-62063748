import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { ServiceCard } from "@/components/ServiceCard";
import { SERVICES } from "@/lib/site";

export const Route = createFileRoute("/services/")({
  head: () => ({
    meta: [
      { title: "Photography Services | Lunaray Studio" },
      { name: "description", content: "Graduation, birthday, wedding, engagement and events photography by Lunaray Studio." },
      { property: "og:title", content: "Photography Services | Lunaray Studio" },
      { property: "og:description", content: "Five ways we tell your story — graduations, birthdays, weddings, engagements and events." },
    ],
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
