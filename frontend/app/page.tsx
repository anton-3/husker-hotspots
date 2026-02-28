"use client";

import dynamic from "next/dynamic";

// Mapbox/Deck.gl rely heavily on browser APIs (WebGL, DOM) so we must
// disable SSR for the entire map component tree.
const CampusMap = dynamic(
  () => import("@/components/map/campus-map").then((mod) => mod.CampusMap),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden">
      <CampusMap />
    </main>
  );
}
