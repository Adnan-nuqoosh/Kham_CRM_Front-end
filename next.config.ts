import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* KHAM Cairo storefront */
  experimental: {
    agentUpgrade: "security",
  },
};

export default nextConfig;
