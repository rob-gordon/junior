import type { MetadataRoute } from "next";
import { participantName } from "@/lib/participants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Junior",
    short_name: "Junior",
    description: `Baby name picker for ${participantName("user1")} & ${participantName("user2")}`,
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f5",
    theme_color: "#faf8f5",
    icons: [
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
