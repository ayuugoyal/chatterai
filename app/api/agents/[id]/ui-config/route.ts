import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { uiConfigs, agents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { corsJsonResponse, handleCorsPreFlight } from "@/lib/cors";

// Handle preflight OPTIONS request for CORS
export async function OPTIONS() {
  return handleCorsPreFlight();
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agentId = params.id;

  try {
    // Verify agent ownership
    const agent = await db.query.agents.findFirst({
      where: and(eq(agents.id, agentId), eq(agents.userId, session.user.id)),
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const body = await req.json();

    // Check if UI config already exists
    const existingConfig = await db.query.uiConfigs.findFirst({
      where: eq(uiConfigs.agentId, agentId),
    });

    if (existingConfig) {
      // Update existing config
      await db
        .update(uiConfigs)
        .set({
          primaryColor: body.primaryColor,
          secondaryColor: body.secondaryColor,
          backgroundColor: body.backgroundColor,
          textColor: body.textColor,
          buttonPosition: body.buttonPosition,
          buttonSize: body.buttonSize,
          widgetWidth: body.widgetWidth,
          widgetHeight: body.widgetHeight,
          borderRadius: body.borderRadius,
          welcomeMessage: body.welcomeMessage,
          buttonIcon: body.buttonIcon,
          headerTitle: body.headerTitle,
          showAgentAvatar: body.showAgentAvatar,
          showTimestamp: body.showTimestamp,
          showTypingIndicator: body.showTypingIndicator,
          allowAttachments: body.allowAttachments,
          maxOutputTokens: body.maxOutputTokens,
          updatedAt: new Date(),
        })
        .where(eq(uiConfigs.id, existingConfig.id));
    } else {
      // Create new config
      await db.insert(uiConfigs).values({
        agentId,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        backgroundColor: body.backgroundColor,
        textColor: body.textColor,
        buttonPosition: body.buttonPosition,
        buttonSize: body.buttonSize,
        widgetWidth: body.widgetWidth,
        widgetHeight: body.widgetHeight,
        borderRadius: body.borderRadius,
        welcomeMessage: body.welcomeMessage,
        buttonIcon: body.buttonIcon,
        headerTitle: body.headerTitle,
        showAgentAvatar: body.showAgentAvatar,
        showTimestamp: body.showTimestamp,
        showTypingIndicator: body.showTypingIndicator,
        allowAttachments: body.allowAttachments,
        maxOutputTokens: body.maxOutputTokens,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving UI configuration:", error);
    return NextResponse.json(
      { error: "Failed to save UI configuration" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const agentId = params.id;

  try {
    // Public endpoint - no auth required for fetching UI config
    const agent = await db.query.agents.findFirst({
      where: eq(agents.id, agentId),
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const config = await db.query.uiConfigs.findFirst({
      where: eq(uiConfigs.agentId, agentId),
    });

    return corsJsonResponse(config || {});
  } catch (error) {
    console.error("Error fetching UI configuration:", error);
    return corsJsonResponse(
      { error: "Failed to fetch UI configuration" },
      500
    );
  }
}
