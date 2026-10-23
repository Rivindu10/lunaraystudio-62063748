import { CONTACT, SERVICES } from "./site";

/**
 * Public address of the live site. Canonical links, social previews, the sitemap
 * reference in robots.txt and structured data all use it.
 * If you connect a custom domain, change it here (and in public/robots.txt).
 */
export const SITE_URL = "https://lunaraystudio.lovable.app";
export const SITE_NAME = "Lunaray Studio";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

/** Makes a bundled-asset path absolute so social networks can fetch it. */
export const absoluteUrl = (pathOrUrl: string) =>
  /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;

interface SeoInput {
  title: string;
  description: string;
  /** Path of the page, e.g. "/services/wedding". */
  path: string;
  /** Social preview image (absolute or bundled-asset URL). Defaults to the site image. */
  image?: string;
  noindex?: boolean;
  jsonLd?: object | object[];
}

/** Returns the full `head()` result (meta, canonical link, structured data) for a page. */
export function seo({ title, description, path, image, noindex, jsonLd }: SeoInput) {
  const url = absoluteUrl(path);
  const img = image && /^https:\/\//.test(image) ? image : undefined;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return {
    meta: [
      { title },
      { name: "description", content: description },
      ...(noindex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      ...(img ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: blocks.map((b) => ({ type: "application/ld+json", children: jsonLdString(b) })),
  };
}

/** Serialises JSON-LD safely for inlining inside a <script> tag. */
export const jsonLdString = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");

export const breadcrumbs = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.name,
    item: absoluteUrl(it.path),
  })),
});

const BUSINESS_ID = `${SITE_URL}/#business`;

/** Site-wide structured data: the business (with its services) and the website. */
export const siteJsonLd = () => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfessionalService",
      "@id": BUSINESS_ID,
      name: SITE_NAME,
      url: SITE_URL,
      image: DEFAULT_OG_IMAGE,
      description:
        "Professional graduation, birthday, wedding, engagement, event and casual photography — timeless, artistic photographs of life's finest moments.",
      telephone: CONTACT.phoneTel,
      email: CONTACT.email,
      areaServed: { "@type": "Country", name: "Sri Lanka" },
      sameAs: Object.values(CONTACT.social).filter(Boolean),
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Photography services",
        itemListElement: SERVICES.map((s) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: s.title, description: s.description, url: absoluteUrl(`/services/${s.slug}`) },
        })),
      },
    },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL, publisher: { "@id": BUSINESS_ID } },
  ],
});

export const serviceJsonLd = (s: { slug: string; title: string; description: string; image: string }) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name: s.title,
  description: s.description,
  url: absoluteUrl(`/services/${s.slug}`),
  image: absoluteUrl(s.image),
  serviceType: s.title,
  provider: { "@id": BUSINESS_ID },
  areaServed: { "@type": "Country", name: "Sri Lanka" },
});
