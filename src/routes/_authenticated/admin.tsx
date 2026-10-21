import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MonthCalendar, CalendarLegend, type DayState } from "@/components/MonthCalendar";
import { SERVICES, TIMES } from "@/lib/site";
import { formatLong, isPastDate, startOfMonth, toISODate } from "@/lib/dates";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Studio Dashboard | Lunaray Studio" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

type Status = "pending" | "confirmed" | "rejected" | "cancelled";

function Admin() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [day, setDay] = useState<string | null>(null);
  const [fStatus, setFStatus] = useState("");
  const [fService, setFService] = useState("");

  const role = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user?.id ?? "").eq("role", "admin");
      return (data?.length ?? 0) > 0;
    },
  });
  const bookings = useQuery({
    queryKey: ["admin-bookings"],
    enabled: role.data === true,
    queryFn: async () => (await supabase.from("bookings").select("*").order("booking_date")).data ?? [],
  });
  const avail = useQuery({
    queryKey: ["admin-avail"],
    enabled: role.data === true,
    queryFn: async () => (await supabase.from("availability").select("*")).data ?? [],
  });

  const signOut = async () => {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (role.isLoading) return <p className="px-5 pt-40 text-center">Loading…</p>;
  if (!role.data)
    return (
      <div className="px-5 pt-40 text-center">
        <p className="font-serif text-3xl text-forest">This account is not a studio administrator.</p>
        <Button variant="line" className="mt-6" onClick={signOut}>Sign out</Button>
      </div>
    );

  const list = bookings.data ?? [];
  const availMap = new Map((avail.data ?? []).map((a) => [a.day, a.status]));
  const getState = (d: Date): DayState => {
    const iso = toISODate(d);
    const confirmed = list.filter((b) => b.booking_date === iso && b.status === "confirmed");
    const fullyBooked = confirmed.some((b) => b.preferred_time === "Full day") || confirmed.length >= TIMES.length;
    if (fullyBooked || availMap.get(iso) === "booked") return "booked";
    if (availMap.get(iso) === "unavailable") return "unavailable";
    if (list.some((b) => b.booking_date === iso && b.status === "pending")) return "pending";
    return isPastDate(d) ? "past" : "available";
  };

  const setStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) toast.error(error.message.includes("time slot") ? "Another booking is already confirmed for this time slot." : error.message);
    else toast.success(`Booking ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-bookings"] });
  };
  const setDayStatus = async (iso: string, status: "available" | "unavailable" | "booked") => {
    const { error } = status === "available"
      ? await supabase.from("availability").delete().eq("day", iso)
      : await supabase.from("availability").upsert({ day: iso, status });
    if (error) toast.error(error.message); else toast.success("Availability updated");
    qc.invalidateQueries({ queryKey: ["admin-avail"] });
  };

  const filtered = list.filter((b) => (!fStatus || b.status === fStatus) && (!fService || b.service === fService) && (!day || b.booking_date === day));
  // All bookings in one list, grouped by date.
  const grouped = [...new Set(filtered.map((b) => b.booking_date))].sort().map((d) => ({
    date: d,
    items: filtered.filter((b) => b.booking_date === d),
  }));

  return (
    <div className="mx-auto max-w-7xl px-5 pb-20 pt-32 md:px-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-5xl text-forest">Studio Dashboard</h1>
        <Button variant="line" onClick={signOut}>Sign out</Button>
      </div>
      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <MonthCalendar month={month} onMonthChange={setMonth} getState={getState} selected={day} allowAnySelect onSelect={(iso) => setDay(day === iso ? null : iso)} />
          <CalendarLegend withPending />
          {day && (
            <div className="mt-6 border border-border bg-card p-5">
              <p className="font-serif text-xl text-forest">{formatLong(day)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setDayStatus(day, "available")}>Mark available</Button>
                <Button size="sm" variant="outline" onClick={() => setDayStatus(day, "unavailable")}>Mark unavailable</Button>
                <Button size="sm" variant="outline" onClick={() => setDayStatus(day, "booked")}>Mark fully booked</Button>
              </div>
            </div>
          )}
        </div>
        <div>
          <div className="flex flex-wrap gap-3">
            <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="h-10 rounded-md border border-input bg-card px-3 text-sm">
              <option value="">All statuses</option>
              {["pending", "confirmed", "rejected", "cancelled"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={fService} onChange={(e) => setFService(e.target.value)} className="h-10 rounded-md border border-input bg-card px-3 text-sm">
              <option value="">All services</option>
              {SERVICES.map((s) => <option key={s.slug} value={s.slug}>{s.short}</option>)}
            </select>
            {day && <Button size="sm" variant="ghost" onClick={() => setDay(null)}>Clear date filter</Button>}
          </div>
          <div className="mt-6 space-y-8">
            {grouped.length === 0 && <p className="text-muted-foreground">No booking requests.</p>}
            {grouped.map((g) => (
              <section key={g.date} aria-label={`Bookings on ${formatLong(g.date)}`}>
                <div className="flex items-baseline justify-between border-b border-border pb-2">
                  <h2 className="font-serif text-2xl text-forest">{formatLong(g.date)}</h2>
                  <span className="eyebrow text-muted-foreground">
                    {g.items.length} booking{g.items.length === 1 ? "" : "s"}
                    {g.items.some((b) => b.status === "pending") && " · pending"}
                  </span>
                </div>
                <ul className="mt-4 space-y-4">
                  {g.items.map((b) => (
                    <li key={b.id} className="border border-border bg-card p-5 text-sm">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-serif text-xl text-forest">{b.full_name}</p>
                        <span className="eyebrow text-primary">{b.status}</span>
                      </div>
                      <p className="mt-1 text-muted-foreground">{b.end_date ? `${formatLong(b.booking_date)} → ${formatLong(b.end_date)} · ` : ""}{b.preferred_time} · {b.service}</p>
                      <p className="mt-1">{b.location}</p>
                      <p className="mt-1"><a className="underline" href={`mailto:${b.email}`}>{b.email}</a> · <a className="underline" href={`tel:${b.phone}`}>{b.phone}</a></p>
                      {b.message && <p className="mt-2 italic text-muted-foreground">“{b.message}”</p>}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {b.status === "pending" && <><Button size="sm" variant="brand" onClick={() => setStatus(b.id, "confirmed")}>Approve</Button><Button size="sm" variant="outline" onClick={() => setStatus(b.id, "rejected")}>Reject</Button></>}
                        {b.status === "confirmed" && <Button size="sm" variant="outline" onClick={() => setStatus(b.id, "cancelled")}>Cancel</Button>}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
