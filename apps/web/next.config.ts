import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@foco/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
