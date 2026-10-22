import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['wihcefsmgiuxiamuvyfy.supabase.co'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb', 
    },
  },
};

export default nextConfig;
