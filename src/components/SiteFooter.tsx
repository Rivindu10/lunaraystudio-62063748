import { Link } from "@tanstack/react-router";
import { CONTACT, NAV, SERVICES } from "@/lib/site";

export function SiteFooter() {
  const socials = Object.entries(CONTACT.social).filter(([, url]) => url);
  return (
    <footer className="bg-forest text-forest-foreground">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:grid-cols-4 md:px-8">
        <div className="md:col-span-1">
          <p className="font-serif text-3xl tracking-[0.12em]">LUNARY</p>
          <p className="eyebrow mt-1 text-[0.55rem] opacity-70">Studio · Photography</p>
          <p className="mt-6 max-w-xs text-sm leading-relaxed opacity-75">
            Timeless, artistic photography for the moments that become your story.
          </p>
          {socials.length > 0 && (
            <ul className="mt-6 flex gap-4 text-sm">
              {socials.map(([name, url]) => (
                <li key={name}><a href={url} target="_blank" rel="noreferrer" className="capitalize opacity-75 hover:opacity-100">{name}</a></li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="eyebrow mb-5 text-lime">Explore</p>
          <ul className="space-y-3 text-sm">
            {NAV.map((n) => (
              <li key={n.to}><Link to={n.to} className="opacity-75 transition hover:opacity-100">{n.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-5 text-lime">Services</p>
          <ul className="space-y-3 text-sm">
            {SERVICES.map((s) => (
              <li key={s.slug}>
                <Link to="/services/$slug" params={{ slug: s.slug }} className="opacity-75 transition hover:opacity-100">{s.title}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-5 text-lime">Contact</p>
          <ul className="space-y-3 text-sm">
            <li><a href={`tel:${CONTACT.phoneTel}`} className="opacity-75 hover:opacity-100">Mobile: {CONTACT.phoneDisplay}</a></li>
            <li><a href={CONTACT.whatsapp} target="_blank" rel="noreferrer" className="opacity-75 hover:opacity-100">WhatsApp: {CONTACT.phoneDisplay}</a></li>
            <li><a href={`mailto:${CONTACT.email}`} className="break-all opacity-75 hover:opacity-100">{CONTACT.email}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-forest-foreground/15">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs opacity-60 md:flex-row md:justify-between md:px-8">
          <p>© {new Date().getFullYear()} Lunary Studio. All rights reserved.</p>
          <Link to="/admin" className="hover:opacity-100">Studio login</Link>
        </div>
      </div>
    </footer>
  );
}

export function WhatsAppButton() {
  return (
    <a
      href={CONTACT.whatsapp}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Lunary Studio on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-primary p-3.5 text-primary-foreground shadow-soft transition hover:scale-105 hover:bg-forest"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43a9.4 9.4 0 0 1 9.43 9.44c0 5.2-4.24 9.43-9.44 9.43m8.03-17.47A11.3 11.3 0 0 0 12.05.7C5.8.7.7 5.8.7 12.06c0 2 .52 3.95 1.52 5.67L.6 23.6l6.02-1.58a11.3 11.3 0 0 0 5.42 1.38h.01c6.26 0 11.35-5.1 11.36-11.36 0-3.03-1.18-5.89-3.32-8.03" />
      </svg>
    </a>
  );
}
