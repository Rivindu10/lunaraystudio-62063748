import { createFileRoute } from "@tanstack/react-router";
import { SERVICES } from "@/lib/site";
import { COLLECTIONS } from "@/lib/portfolio";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const origin = new URL(request.url).origin;
        const paths = ["/", "/about", "/services", "/portfolio", ...COLLECTIONS.map((c) => `/portfolio/${c.category}/${c.slug}`), "/booking", "/contact", ...SERVICES.map((s) => `/services/${s.slug}`)];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths
          .map((p) => `<url><loc>${origin}${p}</loc></url>`)
          .join("")}</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml" } });
      },
    },
  },
});
