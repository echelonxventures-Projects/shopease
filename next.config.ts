import type { NextConfig } from "next";

const getAllowedOrigins = (): string[] => {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim());
  }
  if (process.env.NEXTAUTH_URL) {
    return [process.env.NEXTAUTH_URL.replace(/^https?:\/\//, "").replace(/:\d+$/, "")];
  }
  return process.env.NODE_ENV === "production" ? [] : ["localhost:3000"];
};

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: getAllowedOrigins(),
      bodySizeLimit: "2mb",
    },
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
    remotePatterns: process.env.NEXT_PUBLIC_IMAGE_DOMAIN
      ? [{ protocol: "https", hostname: process.env.NEXT_PUBLIC_IMAGE_DOMAIN }]
      : undefined,
  },
  redirects: async () => [
    { source: "/login", destination: "/auth/login", permanent: false },
    { source: "/register", destination: "/auth/register", permanent: false },
  ],
  output: "standalone",
};

export default nextConfig;
