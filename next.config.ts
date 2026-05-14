import type { NextConfig } from "next";

const ieltsApiBaseUrl = process.env.IELTS_API_BASE_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/tools/product-copy-compliance-checker",
        destination: "https://cross-border-copy-compliance-diagno.vercel.app/",
        permanent: false,
      },
      {
        source: "/tools/product-copy-compliance-checker/amazon-listing",
        destination: "https://cross-border-copy-compliance-diagno.vercel.app/",
        permanent: false,
      },
      {
        source: "/tools/product-copy-compliance-checker/shopify-product-page",
        destination: "https://cross-border-copy-compliance-diagno.vercel.app/",
        permanent: false,
      },
      {
        source: "/tools/product-copy-compliance-checker/packaging-copy",
        destination: "https://cross-border-copy-compliance-diagno.vercel.app/",
        permanent: false,
      },
      {
        source: "/tools/product-copy-compliance-checker/manual-translation-risk",
        destination: "https://cross-border-copy-compliance-diagno.vercel.app/",
        permanent: false,
      },
      {
        source: "/tools/product-copy-compliance-checker/:path*",
        destination: "https://cross-border-copy-compliance-diagno.vercel.app/:path*",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/tools/ielts-api/:path*",
        destination: `${ieltsApiBaseUrl}/api/v1/:path*`,
      },
      {
        source: "/tools/business-image",
        destination: "/tools/business-image/index.html",
      },
    ];
  },
};

export default nextConfig;
