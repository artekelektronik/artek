import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "v5.airtableusercontent.com",
        pathname: "/v3/**",
      },
      {
        protocol: "https",
        hostname: "dl.airtable.com",
        pathname: "/.attachments/**",
      },
      {
        protocol: "https",
        hostname: "dl.airtable.com",
        pathname: "/.attachmentThumbnails/**",
      },
    ],
  },
};

export default nextConfig;
