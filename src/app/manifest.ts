import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Two Fins (Две Ласты)",
    short_name: "Two Fins",
    description: "Личный кабинет школы плавания Two Fins (Две Ласты)",
    start_url: "/",
    display: "standalone",
    background_color: "#041e3d",
    theme_color: "#29d3e0",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
