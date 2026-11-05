import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@artek/ui", "@artek/catalog"],
  experimental: {
    // Keep a visited screen in the browser for 30 s, so going back to it is instant. Saving anything
    // (revalidatePath in the actions) drops this cache, so your own changes still show at once.
    staleTimes: { dynamic: 30 },
  },
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
};

export default nextConfig;
