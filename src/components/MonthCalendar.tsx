import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, type ReactNode, type KeyboardEvent } from "react";
import { addMonths, monthGrid, startOfMonth, toISODate } from "@/lib/dates";
import { cn } from "@/lib/utils";

export type DayState = "available" | "unavailable" | "booked" | "past" | "pending";

interface Props {
  month: Date;
  onMonthChange: (d: Date) => void;
  getState: (date: Date) => DayState;
  selected?: string | null;
  onSelect?: (iso: string, date: Date) => void;
  /** Allow selecting non-available dates (admin). */
  allowAnySelect?: boolean;
  renderExtra?: (iso: string) => ReactNode;
  minMonth?: Date;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const stateClass: Record<DayState, string> = {
  available: "bg-card text-foreground hover:bg-lime/60 border-border",
  pending: "bg-lime/40 text-forest border-lime",
  unavailable: "bg-muted text-muted-foreground line-through decoration-muted-foreground/40 border-transparent",
  booked: "bg-sage/50 text-forest/70 border-transparent",
  past: "text-muted-foreground/40 border-transparent",
};

export function MonthCalendar({ month, onMonthChange, getState, selected, onSelect, allowAnySelect, renderExtra, minMonth }: Props) {
  const days = monthGrid(month);
  const gridRef = useRef<HTMLDivElement>(null);
  const canPrev = !minMonth || startOfMonth(month) > startOfMonth(minMonth);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (delta === undefined) return;
    e.preventDefault();
    const next = gridRef.current?.querySelector<HTMLButtonElement>(`[data-idx="${idx + delta}"]`);
    next?.focus();
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, -1))}
          disabled={!canPrev}
          aria-label="Previous month"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-forest transition hover:bg-forest hover:text-forest-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-forest"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="font-serif text-2xl text-forest md:text-3xl" aria-live="polite">
          {month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </h3>
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, 1))}
          aria-label="Next month"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-forest transition hover:bg-forest hover:text-forest-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 pb-2 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="eyebrow text-[0.6rem] text-muted-foreground">{w}</div>
        ))}
      </div>
      <div ref={gridRef} role="grid" className="grid grid-cols-7 gap-1 md:gap-1.5">
        {days.map((d, i) => {
          const inMonth = d.getMonth() === month.getMonth();
          const iso = toISODate(d);
          const state = getState(d);
          const isSelected = selected === iso;
          const selectable = allowAnySelect ? inMonth : inMonth && (state === "available" || state === "pending");
          const label = `${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}, ${state}`;
          return (
            <button
              key={iso}
              type="button"
              data-idx={i}
              aria-label={label}
              aria-pressed={isSelected}
              disabled={!inMonth || (!allowAnySelect && state === "past")}
              onKeyDown={(e) => onKey(e, i)}
              onClick={() => inMonth && onSelect?.(iso, d)}
              className={cn(
                "relative flex aspect-square min-h-10 flex-col items-center justify-center rounded-sm border text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                !inMonth ? "invisible" : stateClass[state],
                isSelected && "!bg-primary !text-primary-foreground !border-primary !no-underline",
                !selectable && !allowAnySelect && "cursor-not-allowed",
              )}
            >
              <span>{d.getDate()}</span>
              {renderExtra?.(iso)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarLegend({ withPending }: { withPending?: boolean }) {
  const items: [string, string][] = [
    ["Available", "bg-card border border-border"],
    ["Selected", "bg-primary"],
    ["Fully booked", "bg-sage/50"],
    ["Unavailable", "bg-muted"],
  ];
  if (withPending) items.splice(2, 0, ["Has pending requests", "bg-lime/40 border border-lime"]);
  return (
    <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
      {items.map(([l, c]) => (
        <li key={l} className="flex items-center gap-2"><span className={cn("h-3 w-3 rounded-sm", c)} />{l}</li>
      ))}
    </ul>
  );
}
