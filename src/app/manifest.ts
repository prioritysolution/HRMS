import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PrioHRM | HRMS Portal",
    short_name: "PrioHRM",
    description:
      "PrioHRM HRMS Portal — modern SaaS HR, CRM, payroll, and workforce analytics.",
    start_url: "/",
    display: "standalone",
    background_color: "#eef7ff",
    theme_color: "#4666e1",
    icons: [
      {
        src: "/favicon/favicon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon/favicon-384x384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon/favicon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon/favicon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
