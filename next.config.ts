import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // Conteúdo do nicho ainda não disponível — aguarda doc da cliente (ver niches.ts).
        source: "/ensaios/making-of-da-noiva",
        destination: "/ensaios/casamento-civil",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
