import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "dynamic-media-cdn.tripadvisor.com",
      },
      {
        protocol: "https",
        hostname: "watermark.lovepik.com",
      },
      {
        protocol: "https",
        hostname: "w0.peakpx.com",
      },
      {
        protocol: "https",
        hostname: "ansainteriors.com",
      },
    ],
  },
};

export default nextConfig;
