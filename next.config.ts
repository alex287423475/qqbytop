import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: "/tools/business-image",
        destination: "/tools/business-image/index.html",
      },
    ];
  },
};

export default nextConfig;
