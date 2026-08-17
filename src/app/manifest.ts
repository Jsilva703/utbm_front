import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UTMB Trail Tracking",
    short_name: "UTMB Trail",
    description: "Acompanhamento ao vivo de atletas em trilhas.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#050807",
    theme_color: "#050807",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
