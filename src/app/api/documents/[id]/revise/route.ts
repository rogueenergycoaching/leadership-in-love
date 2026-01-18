import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { regenerateDiscoveryDocument } from "@/lib/document-generator";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Get the document
  const document = await prisma.document.findUnique({
    where: { id },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Verify ownership
  if (document.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only DISCOVERY documents can be revised
  if (document.type !== "DISCOVERY") {
    return NextResponse.json(
      { error: "Only 'Your Real Needs' document can be revised" },
      { status: 400 }
    );
  }

  // Get revision feedback from request body
  const body = await request.json();
  const { feedback } = body;

  if (!feedback || typeof feedback !== "string" || feedback.trim().length === 0) {
    return NextResponse.json(
      { error: "Revision feedback is required" },
      { status: 400 }
    );
  }

  try {
    // Regenerate the document with revision feedback
    const newContent = await regenerateDiscoveryDocument(
      session.user.id,
      document.content,
      feedback.trim()
    );

    // Update the document with new content and increment version
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        content: newContent,
        version: { increment: 1 },
      },
    });

    // Reset Round 2 sessions to NOT_STARTED so user reviews updated document
    await prisma.session.updateMany({
      where: {
        userId: session.user.id,
        round: "ROUND_2",
      },
      data: {
        status: "NOT_STARTED",
        messages: [],
        questionCount: 0,
        startedAt: null,
        completedAt: null,
        insights: {},
      },
    });

    // Clear the discoveryViewedAt so they need to view the updated document
    await prisma.user.update({
      where: { id: session.user.id },
      data: { discoveryViewedAt: null },
    });

    return NextResponse.json({
      message: "Document revised successfully",
      document: updatedDocument,
    });
  } catch (error) {
    console.error("Document revision error:", error);
    return NextResponse.json(
      { error: "Failed to revise document" },
      { status: 500 }
    );
  }
}
