"use client";

import { useState, useEffect } from "react";

export function useMedia(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(true);

  useEffect(() => {
    const matchMedia = window.matchMedia(query);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMatches(matchMedia.matches);

    const handleChange = () => setMatches(matchMedia.matches);

    matchMedia.addEventListener("change", handleChange);

    return () => {
      matchMedia.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}
