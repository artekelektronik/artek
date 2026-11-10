"use client";

import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";

// The page reads these on the server, so changes aren't shallow.
const serverRead = { shallow: false, scroll: false, history: "push" } as const;

export const useFatura = () => useQueryState("fatura", parseAsString.withOptions(serverRead));
// ?elle=fatura types an invoice by hand, ?elle=proforma a proforma (ADR-0008).
export const useManualInvoice = () => useQueryState("elle", parseAsStringLiteral(["fatura", "proforma"] as const).withOptions(serverRead));
