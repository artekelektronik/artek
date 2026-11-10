"use client";

import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { manualModes } from "./options";

// The page reads these on the server, so changes aren't shallow.
const serverRead = { shallow: false, scroll: false, history: "push" } as const;

export const useFatura = () => useQueryState("fatura", parseAsString.withOptions(serverRead));
export const useManualInvoice = () => useQueryState("elle", parseAsStringLiteral(manualModes).withOptions(serverRead));
