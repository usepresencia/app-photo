import type { NextConfig } from "next";

const adminPhotoOrigin = process.env.NEXT_PUBLIC_ADMIN_PHOTO_URL;

// 'self' sozinho quando a env var não está setada: o site nunca fica sem
// política nenhuma (nem um wildcard, nem 'none' que quebraria o próprio
// preview quando a var estiver configurada). Ver spec do preview com
// edição inline — "risco de configuração, não de segurança".
const frameAncestors = adminPhotoOrigin ? `'self' ${adminPhotoOrigin}` : "'self'";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "Content-Security-Policy", value: `frame-ancestors ${frameAncestors}` },
];

const nextConfig: NextConfig = {
  // Libera abrir o servidor de desenvolvimento pelo IP da rede local (celular ou
  // outro computador testando o site). Sem isso o Next devolve 403 nos chunks de
  // /_next/static e o JS do client nunca roda: a página aparece, mas nada
  // interativo funciona — o film strip do hero fica congelado, por exemplo.
  // O curinga cobre a faixa inteira para não quebrar quando o roteador troca o IP.
  // Vale apenas em desenvolvimento; não tem efeito no build de produção.
  allowedDevOrigins: ["192.168.*.*"],

  images: {
    // Cloudinary faz resize/format na entrega; ver next-image-loader.ts.
    // O otimizador embutido do Next fica desligado pra qualquer imagem
    // (loaderFile custom vale pra todo next/image, local ou remoto) — ver
    // Global Constraints do plano de migração pro Cloudinary.
    loader: "custom",
    loaderFile: "./next-image-loader.ts",
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },

  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },

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
