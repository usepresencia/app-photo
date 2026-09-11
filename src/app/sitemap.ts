import type { MetadataRoute } from "next";
import { getNiches } from "@/actions/niches";
import { SITE_URL } from "@/lib/config/site";

// Mesmo motivo do force-dynamic em page.tsx: sem isso, o Next
// prerenderiza o sitemap no build (sem credenciais reais) e ele fica
// congelado com a lista de nichos daquele momento, nunca refletindo um
// nicho novo/removido depois do deploy.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const niches = await getNiches();
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    ...niches.map((n) => ({
      url: `${SITE_URL}/ensaios/${n.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
