import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkAndGenerateDocuments } from "@/lib/document-trigger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chatSession = await prisma.session.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!chatSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (chatSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ session: chatSession });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chatSession = await prisma.session.findUnique({
    where: { id },
  });

  if (!chatSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (chatSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { messages, status, questionCount, insights, startedAt, completedAt } =
    body;

  const updateData: Record<string, unknown> = {};

  if (messages !== undefined) updateData.messages = messages;
  if (status !== undefined) updateData.status = status;
  if (questionCount !== undefined) updateData.questionCount = questionCount;
  if (insights !== undefined) updateData.insights = insights;
  if (startedAt !== undefined) updateData.startedAt = new Date(startedAt);
  if (completedAt !== undefined) updateData.completedAt = new Date(completedAt);

  const updatedSession = await prisma.session.update({
    where: { id },
    data: updateData,
  });

  // Trigger document generation if session was completed
  if (status === "COMPLETED") {
    // Run in background to not block the response
    checkAndGenerateDocuments(chatSession.userId).catch((error) => {
      console.error("Background document generation failed:", error);
    });
  }

  return NextResponse.json({ session: updatedSession });
}
