import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  generateDiscoveryDocument,
  generateFinalSynthesis,
} from "@/lib/document-generator";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type } = body;

  if (!type || !["DISCOVERY", "FINAL_SYNTHESIS"].includes(type)) {
    return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
  }

  const userId = session.user.id;

  // Check if document already exists
  const existingDoc = await prisma.document.findFirst({
    where: { userId, type },
  });

  if (existingDoc) {
    return NextResponse.json({ document: existingDoc });
  }

  // Verify prerequisites
  const sessions = await prisma.session.findMany({
    where: { userId },
  });

  if (type === "DISCOVERY") {
    const round1Complete = sessions
      .filter((s) => s.round === "ROUND_1")
      .every((s) => s.status === "COMPLETED");

    if (!round1Complete) {
      return NextResponse.json(
        { error: "Both partners must complete Round 1 first" },
        { status: 400 }
      );
    }
  }

  if (type === "FINAL_SYNTHESIS") {
    const allComplete = sessions.every((s) => s.status === "COMPLETED");

    if (!allComplete) {
      return NextResponse.json(
        { error: "Both partners must complete all rounds first" },
        { status: 400 }
      );
    }

    // Ensure Discovery document exists first
    const discoveryDoc = await prisma.document.findFirst({
      where: { userId, type: "DISCOVERY" },
    });

    if (!discoveryDoc) {
      // Generate Discovery document first
      const discoveryContent = await generateDiscoveryDocument(userId);
      await prisma.document.create({
        data: {
          userId,
          type: "DISCOVERY",
          content: discoveryContent,
        },
      });
    }
  }

  try {
    let content: string;

    if (type === "DISCOVERY") {
      content = await generateDiscoveryDocument(userId);
    } else {
      content = await generateFinalSynthesis(userId);
    }

    const document = await prisma.document.create({
      data: {
        userId,
        type,
        content,
      },
    });

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Document generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate document" },
      { status: 500 }
    );
  }
}
