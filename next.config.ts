import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@libsql/client'],
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
