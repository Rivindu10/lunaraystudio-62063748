import graduation from "@/assets/graduation.jpg";
import birthday from "@/assets/birthday.jpg";
import wedding from "@/assets/wedding.jpg";
import engagement from "@/assets/engagement.jpg";
import events from "@/assets/events.jpg";

export const CONTACT = {
  phoneDisplay: "+94 77 559 5313",
  phoneTel: "+94775595313",
  whatsapp: "https://wa.me/94775595313",
  email: "sanjanakavee2000@gmail.com",
  // Add real profile URLs when available; empty entries are hidden.
  social: { instagram: "", facebook: "", tiktok: "" },
};

export type ServiceSlug = "graduation" | "birthday" | "wedding" | "engagement" | "events";

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
