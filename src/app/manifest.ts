import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zoepp Media – Vertriebsvermittlung",
    short_name: "Zoepp Media",
    description: "CRM-Plattform für D2D-Vertriebler-Vermittlung",
    start_url: "/login",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#c8102e",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
