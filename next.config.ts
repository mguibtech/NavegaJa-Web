import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        // Proxy de arquivos estáticos do backend (uploads de documentos/fotos)
        source: "/uploads/:path*",
        destination: `${API_URL}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
