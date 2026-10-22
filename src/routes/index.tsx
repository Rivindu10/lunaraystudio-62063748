import { createFileRoute, Link } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import hero from "@/assets/hero.jpg";
import about from "@/assets/about.jpg";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/PageHeader";
import { ServiceCard } from "@/components/ServiceCard";
import { Gallery } from "@/components/Gallery";
import { SAMPLE_PHOTOS } from "@/lib/portfolio";
import { SERVICES } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () =>
    seo({
      title: "Lunaray Studio | Timeless Photography",
      description: "Lunaray Studio — professional graduation, birthday, wedding, engagement, event and casual photography. Explore our work and request your session.",
      path: "/",
    }),
  component: Home,
});

// Placeholder testimonials — replace with verified client words.
const TESTIMONIALS = [
  { quote: "Your client's words about their experience will appear here.", name: "Client name", service: "Wedding" },
  { quote: "Share a verified testimonial from a graduation session here.", name: "Client name", service: "Graduation" },
  { quote: "Add a real review from an engagement or event client here.", name: "Client name", service: "Engagement" },
];

function Home() {
  return (
    <>
      <section className="relative flex h-[100svh] min-h-[600px] items-end overflow-hidden">
        <img src={hero} alt="Bride and groom walking hand in hand through an olive grove at sunset" width={1920} height={1088} className="absolute inset-0 h-full w-full animate-slow-zoom object-cover" />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="relative mx-auto w-full max-w-7xl px-5 pb-20 text-forest-foreground md:px-8 md:pb-28">
          <p className="eyebrow animate-fade-up text-lime">Lunaray Studio</p>
          <h1 className="mt-5 max-w-3xl animate-fade-up font-serif text-6xl italic leading-[0.95] md:text-8xl" style={{ animationDelay: "150ms" }}>
            Every Moment Has a Story.
          </h1>
          <p className="mt-6 max-w-lg animate-fade-up text-base opacity-90 md:text-lg" style={{ animationDelay: "300ms" }}>
            Capturing your most meaningful moments with timeless, artistic photography.
          </p>
          <div className="mt-10 flex animate-fade-up flex-wrap gap-4" style={{ animationDelay: "450ms" }}>
            <Button asChild variant="brand" size="xl"><Link to="/portfolio">Explore Our Work</Link></Button>
            <Button asChild variant="heroOutline" size="xl"><Link to="/booking">Book Your Session</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <SectionTitle eyebrow="What we photograph" title={<>Stories worth <em>keeping</em></>} />
        <div className="mt-16 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => <ServiceCard key={s.slug} service={s} index={i} />)}
        </div>
      </section>

      <section className="bg-sage/30">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 md:grid-cols-2 md:px-8 md:py-32">
          <img src={about} alt="Lunaray Studio photographer framing a shot by the window" loading="lazy" width={896} height={1152} className="aspect-[4/5] w-full object-cover" />
          <div>
            <p className="eyebrow text-primary">About the studio</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-forest md:text-6xl">Behind Every Photograph, There's a Story.</h2>
            <p className="mt-6 leading-relaxed text-muted-foreground">
              At Lunaray Studio, we believe the most beautiful photographs are more than images. They are memories, emotions, and stories you can return to for a lifetime.
            </p>
            <Button asChild variant="line" size="xl" className="mt-10"><Link to="/about">Our Story</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <SectionTitle eyebrow="Selected work" title="Our Work" />
        <div className="mt-14"><Gallery photos={SAMPLE_PHOTOS.slice(0, 6)} /></div>
        <div className="mt-12 text-center">
          <Button asChild variant="line" size="xl"><Link to="/portfolio">View All Collections</Link></Button>
        </div>
      </section>

      <section className="bg-secondary/60 px-5 py-24 md:py-32">
        <SectionTitle eyebrow="Kind words" title="From our clients" />
        <div className="mx-auto mt-14 grid max-w-6xl gap-10 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <figure key={i} className="border-t border-forest/20 pt-8">
              <blockquote className="font-serif text-2xl italic leading-snug text-forest">“{t.quote}”</blockquote>
              <figcaption className="eyebrow mt-6 text-muted-foreground">{t.name} · {t.service}</figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground">Sample text — to be replaced with verified client testimonials.</p>
      </section>

      <section className="bg-forest px-5 py-24 text-center text-forest-foreground md:py-32">
        <p className="eyebrow text-lime">Let's create together</p>
        <h2 className="mx-auto mt-5 max-w-3xl font-serif text-5xl italic md:text-7xl">Tell us about your story.</h2>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button asChild variant="brand" size="xl" className="bg-lime text-forest hover:bg-forest-foreground"><Link to="/booking">Book a Session</Link></Button>
          <Button asChild variant="heroOutline" size="xl"><Link to="/contact">Get in Touch</Link></Button>
        </div>
      </section>
    </>
  );
}
