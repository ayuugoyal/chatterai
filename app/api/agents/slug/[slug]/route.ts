import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { corsJsonResponse, handleCorsPreFlight } from "@/lib/cors";

// Handle preflight OPTIONS request for CORS
export async function OPTIONS() {
  return handleCorsPreFlight();
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;

  try {
    // Public endpoint - no auth required for fetching agent by slug
    const agent = await db.query.agents.findFirst({
      where: eq(agents.slug, slug),
    });

    if (!agent) {
      return corsJsonResponse({ error: "Agent not found" }, 404);
    }

    return corsJsonResponse(agent);
  } catch (error) {
    console.error("Error fetching agent by slug:", error);
    return corsJsonResponse({ error: "Failed to fetch agent" }, 500);
  }
}
