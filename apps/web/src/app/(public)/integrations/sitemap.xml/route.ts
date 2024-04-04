import { BASE_URL } from "@/lib/constants";
import { api } from "@/trpc/server";

export async function GET(req: Request) {
  const [integrations] = await Promise.all([api.public.integration.list({})]);
  const publicPages = [
    ...integrations.map((integration) => ({
      url: `${BASE_URL}/integration/${integration.slug}`,
      lastModified: integration.dateUpdated!,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];

  const xml = `
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publicPages
  .map(
    (item) => `
  <url>
    <loc>${item.url}</loc>
    <lastmod>${item.lastModified}</lastmod>
    <changefreq>${item.changeFrequency}</changefreq>
    <priority>${item.priority}</priority>
  </url>
`,
  )
  .join("\n")}
</urlset>  
  `;
  const response = new Response(xml, {
    status: 200,
    statusText: "ok",
  });

  response.headers.append("content-type", "text/xml");

  return response;
}
