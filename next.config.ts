import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@libsql/client', 'bcryptjs'],
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
