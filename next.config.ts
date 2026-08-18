import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Libera abrir o servidor de desenvolvimento pelo IP da rede local (celular ou
  // outro computador testando o site). Sem isso o Next devolve 403 nos chunks de
  // /_next/static e o JS do client nunca roda: a página aparece, mas nada
  // interativo funciona — o film strip do hero fica congelado, por exemplo.
  // O curinga cobre a faixa inteira para não quebrar quando o roteador troca o IP.
  // Vale apenas em desenvolvimento; não tem efeito no build de produção.
  allowedDevOrigins: ["192.168.*.*"],

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
