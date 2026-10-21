import { Link } from "@tanstack/react-router";
import { categoryLabel, type Collection } from "@/lib/portfolio";

export function CollectionCard({ collection: c }: { collection: Collection }) {
  return (
    <article className="group">
      <Link to="/portfolio/$category/$collection" params={{ category: c.category, collection: c.slug }} className="relative block aspect-[4/5] overflow-hidden">
        <img
          src={c.cover}
          alt={c.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-[1.4s] ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-card-overlay" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-forest-foreground">
          <p className="eyebrow text-lime">{categoryLabel(c.category)}</p>
          <h3 className="mt-2 font-serif text-3xl">{c.title}</h3>
        </div>
      </Link>
      <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <span>{c.photos.length} {c.photos.length === 1 ? "photo" : "photos"}</span>
        {c.date && <span>{c.date}</span>}
      </div>
      {c.description && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.description}</p>}
    </article>
  );
}
