"use client";

import { usePathname } from "next/navigation";

export function AppBackground() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      {/* Astronaut centered in background on all other dashboards/pages */}
      <div
        className="h-full w-full bg-contain bg-center bg-no-repeat opacity-30 md:opacity-40 transition-opacity duration-500"
        style={{ backgroundImage: "url('/astronaut.jpg')" }}
      />
      {/* Soft radial fade so content remains readable */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(5,7,10,0.8)_85%)]" />
    </div>
  );
}
