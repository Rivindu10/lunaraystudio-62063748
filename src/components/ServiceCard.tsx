import { Link } from "@tanstack/react-router";
import type { Service } from "@/lib/site";

export function ServiceCard({ service, index }: { service: Service; index?: number }) {
  return (
    <article className="group">
      <Link to="/services/$slug" params={{ slug: service.slug }} className="relative block aspect-[4/5] overflow-hidden">
        <img
          src={service.image}
          alt={service.title}
          loading="lazy"
          width={896}
          height={1152}
          className="h-full w-full object-cover transition duration-[1.4s] ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-card-overlay" />
        {index !== undefined && (
          <span className="absolute left-5 top-5 font-serif text-lg italic text-forest-foreground/80">0{index + 1}</span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-6 text-forest-foreground">
          <h3 className="font-serif text-3xl">{service.title.replace(" Photography", "")}</h3>
        </div>
      </Link>
      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
      <div className="mt-4 flex gap-6 text-xs uppercase tracking-[0.2em]">
        <Link to="/services/$slug" params={{ slug: service.slug }} className="border-b border-forest pb-1 text-forest hover:text-primary hover:border-primary">View Gallery</Link>
        <Link to="/booking" search={{ service: service.slug }} className="pb-1 text-muted-foreground hover:text-primary">Book This Service</Link>
      </div>
    </article>
  );
}
