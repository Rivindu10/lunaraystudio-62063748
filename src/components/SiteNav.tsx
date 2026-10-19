import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NAV } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function SiteNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const overHero = pathname === "/";
  const solid = scrolled || !overHero || open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        solid ? "bg-ivory/95 text-forest shadow-[0_1px_0_var(--border)] backdrop-blur" : "bg-transparent text-forest-foreground",
      )}
    >
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8" aria-label="Main">
        <Link to="/" className="flex flex-col leading-none" aria-label="Lunary Studio home">
          <span className="font-serif text-2xl tracking-[0.12em] md:text-[1.7rem]">LUNARY</span>
          <span className="eyebrow mt-1 text-[0.55rem] opacity-80">Studio · Photography</span>
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {NAV.map((n) => (
            <li key={n.to}>
              <Link
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                className="eyebrow relative py-2 text-[0.68rem] opacity-80 transition hover:opacity-100 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform hover:after:scale-x-100 data-[status=active]:opacity-100 data-[status=active]:after:scale-x-100"
              >
                {n.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <Button asChild variant={solid ? "brand" : "heroOutline"} size="lg" className="hidden sm:inline-flex">
            <Link to="/booking">Book a Session</Link>
          </Button>
          <button
            className="flex h-10 w-10 items-center justify-center lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-border bg-ivory px-5 pb-8 pt-4 lg:hidden">
          <ul className="flex flex-col">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link
                  to={n.to}
                  activeOptions={{ exact: n.to === "/" }}
                  className="block border-b border-border py-4 font-serif text-2xl text-forest data-[status=active]:text-primary"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <Button asChild variant="brand" size="xl" className="mt-6 w-full">
            <Link to="/booking">Book a Session</Link>
          </Button>
        </div>
      )}
    </header>
  );
}
