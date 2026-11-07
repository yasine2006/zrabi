/**
 * Renders a JSON-LD block. The payload is generated server-side from typed
 * objects, never from user input, so `dangerouslySetInnerHTML` is safe here.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function organizationJsonLd(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Zarbia Atlas",
    url: baseUrl,
    logo: `${baseUrl}/icon.svg`,
    description:
      "Tapis marocains authentiques tissés main dans le Moyen Atlas, le Haut Atlas et le Haouz. Pièces uniques, certificat d’origine et livraison internationale.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Aït Bouguemez",
      addressRegion: "Moyen Atlas",
      addressCountry: "MA",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "bonjour@zarbia-atlas.ma",
      availableLanguage: ["French", "English", "Arabic"],
    },
  };
}

export function websiteJsonLd(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Zarbia Atlas",
    url: baseUrl,
    inLanguage: ["fr", "en", "ar"],
  };
}

export function breadcrumbJsonLd(
  baseUrl: string,
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.path}`,
    })),
  };
}
