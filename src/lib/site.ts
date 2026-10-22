import graduation from "@/assets/graduation.jpg";
import birthday from "@/assets/birthday.jpg";
import wedding from "@/assets/wedding.jpg";
import engagement from "@/assets/engagement.jpg";
import events from "@/assets/events.jpg";
import casualImg from "@/assets/portfolio/casual/everyday-moments/01.jpg";

export const CONTACT = {
  phoneDisplay: "+94 77 559 5313",
  phoneTel: "+94775595313",
  whatsapp: "https://wa.me/94775595313",
  email: "sanjanakavee2000@gmail.com",
  // Add real profile URLs when available; empty entries are hidden.
  social: { instagram: "", facebook: "", tiktok: "" },
};

export type ServiceSlug = "graduation" | "birthday" | "wedding" | "engagement" | "events" | "casual";

export interface Service {
  slug: ServiceSlug;
  title: string;
  short: string;
  description: string;
  image: string;
  /** Package details — placeholders until the owner provides real information. */
  packages: { name: string; details: string }[];
}

const placeholderPackages = [
  { name: "Essential", details: "Package details coming soon — contact us for current information." },
  { name: "Signature", details: "Package details coming soon — contact us for current information." },
  { name: "Custom", details: "Tell us what you need and we'll tailor a session for you." },
];

export const SERVICES: Service[] = [
  {
    slug: "graduation",
    title: "Graduation Photography",
    short: "Graduation",
    description:
      "Celebrate your achievements with beautiful graduation portraits, university memories, and creative graduation sessions.",
    image: graduation,
    packages: placeholderPackages,
  },
  {
    slug: "birthday",
    title: "Birthday Photography",
    short: "Birthdays",
    description:
      "Capture birthday celebrations, milestone birthdays, creative portraits, and unforgettable party moments.",
    image: birthday,
    packages: placeholderPackages,
  },
  {
    slug: "wedding",
    title: "Wedding Photography",
    short: "Weddings",
    description:
      "Preserve the emotions, details, ceremonies, and special moments of your wedding day through timeless storytelling.",
    image: wedding,
    packages: placeholderPackages,
  },
  {
    slug: "engagement",
    title: "Engagement Photography",
    short: "Engagements",
    description:
      "Beautiful pre-wedding and engagement sessions designed to capture love, connection, and your unique story.",
    image: engagement,
    packages: placeholderPackages,
  },
  {
    slug: "events",
    title: "Events Photography",
    short: "Events",
    description:
      "Professional photography for private parties, celebrations, corporate events, and special occasions.",
    image: events,
    packages: placeholderPackages,
  },
  {
    slug: "casual",
    title: "Casual Shoot",
    short: "Casual",
    description:
      "Relaxed, natural photo sessions for individuals, couples, friends and families — everyday moments, beautifully captured.",
    image: casualImg,
    packages: placeholderPackages,
  },
];

export const serviceBySlug = (slug: string) => SERVICES.find((s) => s.slug === slug);

export const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/portfolio", label: "Our Work" },
  { to: "/booking", label: "Booking" },
  { to: "/contact", label: "Contact" },
] as const;

/** Bookable time slots; "Full day" conflicts with every other slot on the same date. */
export const TIMES = ["Morning (8am – 12pm)", "Afternoon (12pm – 4pm)", "Golden hour (4pm – 7pm)", "Evening (after 7pm)", "Full day"];

const fmtHour = (h: number) => `${String(h).padStart(2, "0")}:00`;
/** Graduation sessions are booked hour by hour, 8am to 7pm. Labels must start with "HH:00" (parsed by the database). */
export const GRADUATION_TIMES = Array.from({ length: 11 }, (_, i) => `${fmtHour(8 + i)} – ${fmtHour(9 + i)}`);

export const timesFor = (service: string) => (service === "graduation" ? GRADUATION_TIMES : TIMES);

/** Hour range [start, end) a slot occupies — mirrors public.slot_range in the database. */
export function slotRange(t: string): [number, number] {
  if (t === "Full day") return [0, 24];
  if (t.startsWith("Morning")) return [8, 12];
  if (t.startsWith("Afternoon")) return [12, 16];
  if (t.startsWith("Golden hour")) return [16, 19];
  if (t.startsWith("Evening")) return [19, 24];
  const m = /^(\d{2}):00/.exec(t);
  if (m) { const h = Number(m[1]); return [h, h + 1]; }
  return [0, 24];
}

export const slotsOverlap = (a: string, b: string) => {
  const [a1, a2] = slotRange(a), [b1, b2] = slotRange(b);
  return a1 < b2 && b1 < a2;
};

/** A day is full when every hour from 8am to midnight is covered by confirmed bookings. */
export const isDayFull = (taken: string[]) =>
  taken.length > 0 && Array.from({ length: 16 }, (_, i) => 8 + i).every((h) => taken.some((t) => { const [s, e] = slotRange(t); return s <= h && h < e; }));
