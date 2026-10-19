import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Photo } from "@/lib/portfolio";

export function Gallery({ photos }: { photos: Photo[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const close = useCallback(() => setIndex(null), []);
  const go = useCallback(
    (d: number) => setIndex((i) => (i === null ? i : (i + d + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [index, close, go]);

  if (!photos.length) {
    return <p className="py-20 text-center text-muted-foreground">No photographs in this collection yet.</p>;
  }

  const current = index !== null ? photos[index] : null;

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
        {photos.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setIndex(i)}
            className="group relative block w-full overflow-hidden break-inside-avoid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Open photo: ${p.alt}`}
          >
            <img
              src={p.src}
              alt={p.alt}
              loading="lazy"
              decoding="async"
              className="w-full transition duration-[1.2s] ease-out group-hover:scale-[1.04]"
            />
            <span className="absolute inset-0 bg-overlay/0 transition duration-500 group-hover:bg-overlay/25" />
          </button>
        ))}
      </div>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-overlay/95 p-4 animate-in fade-in duration-300"
          onClick={close}
        >
          <img
            src={current.src}
            alt={current.alt}
            className="max-h-[88vh] max-w-full object-contain shadow-soft"
            onClick={(e) => e.stopPropagation()}
          />
          <button onClick={close} aria-label="Close" className="absolute right-4 top-4 rounded-full p-3 text-forest-foreground hover:bg-forest-foreground/10">
            <X className="h-6 w-6" />
          </button>
          {photos.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous photo" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-3 text-forest-foreground hover:bg-forest-foreground/10 md:left-6">
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next photo" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-3 text-forest-foreground hover:bg-forest-foreground/10 md:right-6">
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}
          <p className="eyebrow absolute bottom-5 left-1/2 -translate-x-1/2 text-forest-foreground/70">
            {(index ?? 0) + 1} / {photos.length}
          </p>
        </div>
      )}
    </>
  );
}
