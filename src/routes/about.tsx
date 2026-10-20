import { createFileRoute, Link } from "@tanstack/react-router";
import about from "@/assets/about.jpg";
import engagement from "@/assets/engagement.jpg";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About | Lunaray Studio" },
      { name: "description", content: "Meet Lunaray Studio — artistic, emotional photography for graduations, weddings, engagements, birthdays and events." },
      { property: "og:title", content: "About Lunaray Studio" },
      { property: "og:description", content: "Behind every photograph, there's a story." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <>
      <PageHeader eyebrow="About Lunaray Studio" title={<>Behind Every Photograph, <em>There's a Story.</em></>} />
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 md:grid-cols-2 md:px-8">
        <img src={about} alt="Photographer at work with a film camera" loading="lazy" width={896} height={1152} className="aspect-[4/5] w-full object-cover" />
        <div className="space-y-6 leading-relaxed text-muted-foreground">
          <p className="font-serif text-3xl leading-snug text-forest">
            “At Lunaray Studio, we believe the most beautiful photographs are more than images.”
          </p>
          <p>
            They are memories, emotions, and stories you can return to for a lifetime. From graduation milestones to weddings and unforgettable celebrations, we capture every moment with creativity, care, and attention to detail.
          </p>
          {/* Editable photographer introduction */}
          <p>
            Hello — I'm the photographer behind Lunaray Studio. A personal introduction about my approach, inspiration and the way I work with clients will be added here.
          </p>
          <Button asChild variant="line" size="xl"><Link to="/portfolio">View the Portfolio</Link></Button>
        </div>
      </section>
      <section className="relative h-[60vh] overflow-hidden">
        <img src={engagement} alt="Couple embracing in a meadow" loading="lazy" className="h-full w-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-overlay/40 px-5 text-center">
          <p className="max-w-3xl font-serif text-4xl italic text-forest-foreground md:text-6xl">Natural light. Honest emotion. Timeless frames.</p>
        </div>
      </section>
    </>
  );
}
