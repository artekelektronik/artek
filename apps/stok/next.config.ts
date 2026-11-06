import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@artek/ui", "@artek/catalog"],
  experimental: {
    // 30 s client cache; revalidatePath in actions clears it.
    staleTimes: { dynamic: 30 },
  },
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
};

export default nextConfig;
