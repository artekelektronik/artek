import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored from tablecn, kept as upstream wrote it.
    "components/data-table/data-table*.tsx",
    "components/ui/faceted.tsx",
    "components/ui/direction.tsx",
    "hooks/use-data-table.ts",
    "hooks/use-debounced-callback.ts",
    "lib/data-table-*.ts",
  ]),
]);

export default eslintConfig;
