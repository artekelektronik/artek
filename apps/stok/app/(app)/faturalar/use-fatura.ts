"use client";

import { parseAsString, useQueryState } from "nuqs";

// The open invoice (?fatura=); the page reads it on the server, so changes aren't shallow.
export const useFatura = () => useQueryState("fatura", parseAsString.withOptions({ shallow: false, scroll: false, history: "push" }));
