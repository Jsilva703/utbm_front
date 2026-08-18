import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RacePulse",
    short_name: "RacePulse",
    description: "Acompanhamento de atletas e progresso em provas de endurance.",
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
