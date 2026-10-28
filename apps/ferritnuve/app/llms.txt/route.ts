import { llmsText } from "@/lib/llms";
import { getSiteUrl } from "@/lib/seo";

export const dynamic = "force-static";

export async function GET() {
  return new Response(llmsText(await getSiteUrl()), {headers: {"Content-Type": "text/markdown; charset=utf-8"}});
}
