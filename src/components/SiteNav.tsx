import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NAV } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Admin-only: true when the signed-in user has the admin role (enforced again by the database). */
function useAdminBookings() {
  const qc = useQueryClient();
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => {
      qc.invalidateQueries({ queryKey: ["is-admin"] });
      qc.invalidateQueries({ queryKey: ["pending-count"] });
    });
    return () => data.subscription.unsubscribe();
  }, [qc]);
  const isAdmin = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin");
      return (data?.length ?? 0) > 0;
    },
  });
  const pending = useQuery({
    queryKey: ["pending-count"],
    enabled: isAdmin.data === true,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { count } = await supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending");
      return count ?? 0;
    },
  });
  return { isAdmin: isAdmin.data === true, pending: pending.data ?? 0 };
}

export function SiteNav() {
  const { isAdmin, pending } = useAdminBookings();
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
        <Link to="/" className="flex flex-col leading-none" aria-label="Lunaray Studio home">
          <span className="font-serif text-2xl tracking-[0.12em] md:text-[1.7rem]">LUNARAY</span>
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
          {isAdmin && (
            <li>
              <Link to="/admin" className="eyebrow py-2 text-[0.68rem] opacity-80 transition hover:opacity-100 data-[status=active]:opacity-100">
                Booking Requests{pending > 0 && <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[0.6rem] text-primary-foreground">{pending}</span>}
              </Link>
            </li>
          )}
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
            {isAdmin && (
              <li>
                <Link to="/admin" className="block border-b border-border py-4 font-serif text-2xl text-forest data-[status=active]:text-primary">
                  Booking Requests{pending > 0 && <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[0.6rem] text-primary-foreground">{pending}</span>}
                </Link>
              </li>
            )}
          </ul>
          <Button asChild variant="brand" size="xl" className="mt-6 w-full">
            <Link to="/booking">Book a Session</Link>
          </Button>
        </div>
      )}
    </header>
  );
}
