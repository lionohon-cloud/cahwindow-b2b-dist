import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages requires edge runtime
  // Individual routes declare: export const runtime = 'edge'
};

export default nextConfig;
