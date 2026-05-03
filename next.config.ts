import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: "/tools/business-image",
        destination: "/tools/business-image/index.html",
      },
      {
        source: "/tools/product-copy-compliance-checker/amazon-listing",
        destination: "https://cross-border-copy-compliance-diagno.vercel.app/",
      },
      {
        source: "/tools/product-copy-compliance-checker/shopify-product-page",
        destination: "https://cross-border-copy-compliance-diagno.vercel.app/",
      },
      {
        source: "/tools/product-copy-compliance-checker/packaging-copy",
        destination: "https://cross-border-copy-compliance-diagno.vercel.app/",
      },
      {
        source: "/tools/product-copy-compliance-checker/manual-translation-risk",
        destination: "https://cross-border-copy-compliance-diagno.vercel.app/",
      },
      {
        source: "/tools/product-copy-compliance-checker/:path*",
        destination: "https://cross-border-copy-compliance-diagno.vercel.app/:path*",
      },
    ];
  },
};

export default nextConfig;
