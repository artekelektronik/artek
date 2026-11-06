"use client";

import { parseAsBoolean, parseAsString, useQueryState } from "nuqs";

// The page reads these on the server, so changes aren't shallow.
const serverRead = { shallow: false, scroll: false, history: "push" } as const;

export const useFatura = () => useQueryState("fatura", parseAsString.withOptions(serverRead));
export const useManualInvoice = () => useQueryState("elle", parseAsBoolean.withOptions(serverRead));
