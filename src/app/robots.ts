import type { MetadataRoute } from "next";

const BASE_URL = "https://denisegalvao.com.br"; // TODO: substituir pelo domínio real

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
