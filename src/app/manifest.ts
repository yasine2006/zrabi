import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zarbia Atlas — Tapis marocains faits main",
    short_name: "Zarbia Atlas",
    description:
      "Tapis marocains authentiques tissés main dans l’Atlas. Pièces uniques, certificat d’origine et livraison internationale.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF6F0",
    theme_color: "#1C1712",
    lang: "fr",
    dir: "ltr",
    categories: ["shopping", "lifestyle"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
