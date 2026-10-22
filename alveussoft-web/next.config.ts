import type { NextConfig } from "next";

// Extraer hostname de Supabase desde variable de entorno
const getSupabaseHostname = () => {
  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL || "";
  
  if (!storageUrl) {
    return null;
  }
  try {
    return storageUrl;
  } catch (error) {
    console.error("Error extrayendo hostname:", error);
    return null;
  }
};

const supabaseHostname = getSupabaseHostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "ik.imagekit.io",
        protocol: "https",
      },
      // Solo agregar Supabase si hay hostname válido
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              port: "",
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

export default nextConfig;
