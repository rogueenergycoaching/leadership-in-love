import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PartnerConfirmation } from "@/components/PartnerConfirmation";
import { ChatInterface } from "@/components/ChatInterface";

async function getSession(id: string, userId: string) {
  const session = await prisma.session.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!session || session.userId !== userId) {
    return null;
  }

  return session;
}

async function checkRound2Access(userId: string) {
  const round1Sessions = await prisma.session.findMany({
    where: {
      userId,
      round: "ROUND_1",
    },
  });

  return round1Sessions.every((s) => s.status === "COMPLETED");
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const authSession = await auth();
  const { id } = await params;

  if (!authSession?.user) {
    redirect("/login");
  }

  const chatSession = await getSession(id, authSession.user.id);

  if (!chatSession) {
    redirect("/dashboard");
  }

  // Check if Round 2 is accessible
  if (chatSession.round === "ROUND_2") {
    const canAccessRound2 = await checkRound2Access(authSession.user.id);
    if (!canAccessRound2) {
      redirect("/dashboard");
    }
  }

  const partnerName =
    chatSession.partnerRole === "A"
      ? chatSession.user.partnerAName
      : chatSession.user.partnerBName;

  const otherPartnerName =
    chatSession.partnerRole === "A"
      ? chatSession.user.partnerBName
      : chatSession.user.partnerAName;

  const otherPartnerGender =
    chatSession.partnerRole === "A"
      ? chatSession.user.partnerBGender
      : chatSession.user.partnerAGender;

  // Show partner confirmation if session not started
  if (chatSession.status === "NOT_STARTED") {
    return (
      <PartnerConfirmation
        sessionId={chatSession.id}
        partnerName={partnerName}
        round={chatSession.round}
      />
    );
  }

  // Show chat interface for in-progress or completed sessions
  return (
    <ChatInterface
      sessionId={chatSession.id}
      partnerName={partnerName}
      otherPartnerName={otherPartnerName}
      otherPartnerGender={otherPartnerGender}
      round={chatSession.round}
      initialMessages={(chatSession.messages as unknown as Array<{ role: string; content: string }>) || []}
      initialQuestionCount={chatSession.questionCount}
      isCompleted={chatSession.status === "COMPLETED"}
    />
  );
}
