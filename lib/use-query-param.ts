"use client";

import { useEffect, useState } from "react";

/** Read a query parameter after mount so pages avoid a Suspense boundary. */
export function useInitialQueryParam(name: string): string | null {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setValue(params.get(name));
  }, [name]);
  return value;
}
