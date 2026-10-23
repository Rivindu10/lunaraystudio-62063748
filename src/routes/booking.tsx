import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { MonthCalendar, CalendarLegend, type DayState } from "@/components/MonthCalendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { notifyNewBooking } from "@/lib/booking-notify.functions";
import { SERVICES, joinSlots, maxSlotsFor, slotsOverlap, timesFor, toggleSlot, validSlotSelection, type ServiceSlug } from "@/lib/site";
import { cn } from "@/lib/utils";
import { addMonths, formatLong, isPastDate, monthGrid, startOfMonth, toISODate } from "@/lib/dates";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/booking")({
  validateSearch: (s: Record<string, unknown>): { service?: ServiceSlug } => {
    const v = s["service"];
    return SERVICES.some((x) => x.slug === v) ? { service: v as ServiceSlug } : {};
  },
  head: () =>
    seo({
      title: "Book Your Session | Lunaray Studio",
      description: "Check availability and request your photography session with Lunaray Studio — pick a date and time slot that suits you.",
      path: "/booking",
    }),
  component: Booking,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Field = "full_name"|"email"|"phone"|"service"|"date"|"preferred_time"|"location"|"end_date"|"form";
type Errors = Partial<Record<Field, string>>;
type FormVals = { full_name: string; email: string; phone: string; service: string; preferred_time: string; location: string; end_date: string; message: string };

function Booking() {
  const search = Route.useSearch();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ date: string; name: string } | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const grid = monthGrid(month);
  const from = toISODate(grid[0] ?? month);
  const to = toISODate(grid[41] ?? month);
  const blockedQ = useQuery({
    queryKey: ["blocked", from, to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_blocked_dates", { _from: from, _to: to });
      if (error) throw error;
      return new Map((data ?? []).map((r) => [r.day, r.status as "booked" | "unavailable"]));
    },
  });
  const blocked = blockedQ.data ?? new Map<string, string>();

  // Time slots already taken on the selected date (confirmed bookings only).
  const slotsQ = useQuery({
    queryKey: ["taken-slots", selected],
    enabled: !!selected,
    queryFn: async () => {
      if (!selected) return [];
      const { data, error } = await supabase.rpc("get_taken_slots", { _day: selected });
      if (error) throw error;
      return (data ?? []).map((r) => r.preferred_time);
    },
  });
  const takenSlots = slotsQ.data ?? [];
  useEffect(() => setSelectedTimes([]), [selected]);
  const [service, setService] = useState<string>((search as { service?: string }).service ?? "");
  const slots = timesFor(service);
  const time = joinSlots(selectedTimes);

  const getState = (d: Date): DayState => {
    if (isPastDate(d)) return "past";
    const b = blocked.get(toISODate(d));
    if (b === "booked") return "booked";
    if (b === "unavailable") return "unavailable";
    return "available";
  };

  const onSelect = (iso: string, d: Date) => {
    const st = getState(d);
    if (st === "past") return;
    if (st !== "available") {
      setNotice(st === "booked" ? "Sorry, this date is fully booked. Please choose another date." : "Sorry, this date is unavailable. Please choose another date.");
      return;
    }
    setNotice(null);
    setSelected(iso);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = Object.fromEntries(f.entries()) as unknown as FormVals;
    const errs: Errors = {};
    if (!v.full_name?.trim()) errs.full_name = "Please enter your full name.";
    if (!EMAIL_RE.test(v.email ?? "")) errs.email = "Please enter a valid email address.";
    if ((v.phone ?? "").replace(/\D/g, "").length < 7) errs.phone = "Please enter a valid contact number.";
    if (!v.service) errs.service = "Please choose a service.";
    if (!selected) errs.date = "Please select a date on the calendar.";
    if (!validSlotSelection(service, selectedTimes)) errs.preferred_time = service === "graduation" ? "Please select one to three hourly time slots." : "Please choose a preferred time.";
    if (slotsQ.isFetching || slotsQ.isError || selectedTimes.some((t) => takenSlots.some((x) => slotsOverlap(x, t)))) errs.preferred_time = "Please wait for availability or choose available time slots.";
    if (!v.location?.trim()) errs.location = "Please tell us the event location.";
    if (v.end_date && selected && v.end_date < selected) errs.end_date = "End date must be on or after the start date.";
    setErrors(errs);
    if (Object.keys(errs).length || !selected) return;

    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      full_name: v.full_name.trim().slice(0, 120),
      email: v.email.trim().slice(0, 255),
      phone: v.phone.trim().slice(0, 30),
      service: v.service as ServiceSlug,
      booking_date: selected,
      end_date: v.end_date || null,
      preferred_time: time,
      location: v.location.trim().slice(0, 200),
      message: v.message?.trim().slice(0, 2000) || null,
    });
    setSubmitting(false);
    if (error) {
      setErrors({ form: error.message.includes("available") || error.message.includes("time slot") ? error.message : "We couldn't send your request. Please try again or contact us on WhatsApp." });
      blockedQ.refetch();
      slotsQ.refetch();
      return;
    }
    // Email the studio about the new request; the booking is already saved, so never block on this.
    void notifyNewBooking({ data: { email: v.email.trim().slice(0, 255), booking_date: selected, preferred_time: time } }).catch(() => {});
    setDone({ date: selected, name: v.full_name.trim() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const minMonth = useMemo(() => startOfMonth(new Date()), []);

  if (done) {
    return (
      <>
        <PageHeader eyebrow="Request received" title={<>Thank you, <em>{done.name.split(" ")[0]}</em></>} />
        <section className="mx-auto max-w-xl px-5 py-20 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
          <p className="mt-6 font-serif text-2xl text-forest">Your request for {formatLong(done.date)} is pending.</p>
          <p className="mt-4 text-muted-foreground">
            This is not yet a confirmed booking. The photographer will review your request and get back to you by email or phone to confirm.
          </p>
          <Button asChild variant="line" size="xl" className="mt-10"><Link to="/">Back to home</Link></Button>
        </section>
      </>
    );
  }

  const field = (name: Field) => errors[name] && <p className="mt-1.5 text-xs text-destructive" role="alert">{errors[name]}</p>;

  return (
    <>
      <PageHeader eyebrow="Booking" title={<>Book Your <em>Session</em></>}>
        Choose a preferred date, tell us about your plans, and we'll confirm availability personally.
      </PageHeader>

      <section className="mx-auto grid max-w-7xl gap-14 px-5 py-16 md:px-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow mb-6 text-primary">1 · Select a date</p>
          <div className="relative">
            <MonthCalendar month={month} onMonthChange={setMonth} getState={getState} selected={selected} onSelect={onSelect} minMonth={minMonth} />
            {blockedQ.isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-ivory/60"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            )}
          </div>
          {blockedQ.isError && <p className="mt-4 text-sm text-destructive">Couldn't load availability. Please refresh.</p>}
          <CalendarLegend />
          {notice && <p className="mt-5 border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">{notice}</p>}
          {selected && <p className="mt-5 border-l-2 border-primary bg-lime/30 px-4 py-3 text-sm text-forest">Selected: <strong className="font-medium">{formatLong(selected)}</strong></p>}
        </div>

        <div ref={formRef} className="scroll-mt-28">
          <p className="eyebrow mb-6 text-primary">2 · Your details</p>
          <form onSubmit={onSubmit} noValidate className="space-y-5">
            <div>
              <Label htmlFor="full_name">Full name *</Label>
              <Input id="full_name" name="full_name" maxLength={120} className="mt-2 h-11" aria-invalid={!!errors.full_name} />
              {field("full_name")}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="email">Email address *</Label>
                <Input id="email" name="email" type="email" maxLength={255} className="mt-2 h-11" aria-invalid={!!errors.email} />
                {field("email")}
              </div>
              <div>
                <Label htmlFor="phone">Contact number *</Label>
                <Input id="phone" name="phone" type="tel" maxLength={30} className="mt-2 h-11" aria-invalid={!!errors.phone} />
                {field("phone")}
              </div>
            </div>
            <div>
              <Label htmlFor="service">Photography service *</Label>
              <select id="service" name="service" value={service} onChange={(e) => { setService(e.target.value); setSelectedTimes([]); }} className="mt-2 h-11 w-full rounded-md border border-input bg-card px-3 text-sm" aria-invalid={!!errors.service}>
                <option value="" disabled>Select a service</option>
                {SERVICES.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)}
              </select>
              {field("service")}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label>Preferred date *</Label>
                <div className="mt-2 flex h-11 items-center rounded-md border border-input bg-muted/50 px-3 text-sm">
                  {selected ? formatLong(selected) : <span className="text-muted-foreground">Pick on the calendar</span>}
                </div>
                {field("date")}
              </div>
              <div>
                <Label htmlFor="end_date">End date (multi-day events)</Label>
                <Input id="end_date" name="end_date" type="date" min={selected ?? toISODate(new Date())} max={toISODate(addMonths(new Date(), 36))} className="mt-2 h-11" />
                {field("end_date")}
              </div>
            </div>
            <div>
              <Label>Preferred time *</Label>
              {selected && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Available time slots on {formatLong(selected)}
                  {slotsQ.isFetching && " — checking…"}
                </p>
              )}
              {service === "graduation" && <p className="mt-1 text-xs text-muted-foreground">{selectedTimes.length} / 3 hours selected</p>}
              <input type="hidden" name="preferred_time" value={time} />
              <div className={cn("mt-2 grid gap-2", service === "graduation" && "sm:grid-cols-2")} role={service === "graduation" ? "group" : "radiogroup"} aria-label="Preferred time">
                {slots.map((t) => {
                  const isTaken = takenSlots.some((x) => slotsOverlap(x, t));
                  const isChosen = selectedTimes.includes(t);
                  const atLimit = !isChosen && selectedTimes.length >= maxSlotsFor(service) && service === "graduation";
                  const onlyLeft = !!selected && !isTaken && slots.every((x) => x === t || takenSlots.some((y) => slotsOverlap(y, x)));
                  return (
                    <Button
                      variant="outline"
                      key={t}
                      type="button"
                      role={service === "graduation" ? "checkbox" : "radio"}
                      aria-checked={isChosen}
                      disabled={isTaken || atLimit || !selected || slotsQ.isFetching || slotsQ.isError}
                      onClick={() => setSelectedTimes((current) => toggleSlot(service, current, t))}
                      className={cn(
                        "h-auto min-h-11 w-full items-center justify-between whitespace-normal rounded-md border px-3 py-2.5 text-left text-sm transition",
                        isChosen ? "border-primary bg-lime/30 text-forest" : "border-input bg-card text-forest hover:border-primary/50",
                        isTaken && "cursor-not-allowed line-through opacity-50",
                      )}
                    >
                      <span>{t}</span>
                      {isTaken ? (
                        <span className="text-xs">Booked</span>
                      ) : onlyLeft ? (
                        <span className="eyebrow text-primary">Only slot left</span>
                       ) : isChosen ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      ) : <span className="h-4 w-4 shrink-0 rounded-sm border border-input" />}
                    </Button>
                  );
                })}
              </div>
              {field("preferred_time")}
            </div>
            <div>
              <Label htmlFor="location">Event location *</Label>
              <Input id="location" name="location" maxLength={200} className="mt-2 h-11" aria-invalid={!!errors.location} />
              {field("location")}
            </div>
            <div>
              <Label htmlFor="message">Message or special requests</Label>
              <Textarea id="message" name="message" maxLength={2000} rows={5} className="mt-2" />
            </div>
            {errors.form && <p className="border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">{errors.form}</p>}
            <Button type="submit" variant="brand" size="xl" className="w-full" disabled={submitting}>
              {submitting ? <><Loader2 className="animate-spin" /> Sending…</> : "Request Booking"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">Your session is confirmed only after the photographer approves it.</p>
          </form>
        </div>
      </section>
    </>
  );
}
