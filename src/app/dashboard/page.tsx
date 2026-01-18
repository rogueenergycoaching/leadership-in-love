import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { GenerateDocumentButton } from "@/components/GenerateDocumentButton";

async function getSessionProgress(userId: string) {
  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: [{ round: "asc" }, { partnerRole: "asc" }],
  });

  const round1A = sessions.find(
    (s) => s.round === "ROUND_1" && s.partnerRole === "A"
  );
  const round1B = sessions.find(
    (s) => s.round === "ROUND_1" && s.partnerRole === "B"
  );
  const round2A = sessions.find(
    (s) => s.round === "ROUND_2" && s.partnerRole === "A"
  );
  const round2B = sessions.find(
    (s) => s.round === "ROUND_2" && s.partnerRole === "B"
  );

  const bothRound1Complete =
    round1A?.status === "COMPLETED" && round1B?.status === "COMPLETED";
  const bothRound2Complete =
    round2A?.status === "COMPLETED" && round2B?.status === "COMPLETED";

  return {
    round1A,
    round1B,
    round2A,
    round2B,
    bothRound1Complete,
    bothRound2Complete,
  };
}

async function getDocuments(userId: string) {
  return prisma.document.findMany({
    where: { userId },
  });
}

function SessionCard({
  partnerName,
  round1Status,
  round2Status,
  round2Locked,
  round2LockedReason,
  round1SessionId,
  round2SessionId,
}: {
  partnerName: string;
  round1Status: string;
  round2Status: string;
  round2Locked: boolean;
  round2LockedReason?: "partner" | "document";
  round1SessionId?: string;
  round2SessionId?: string;
}) {
  const getStatusDisplay = (status: string, locked: boolean = false) => {
    if (locked) return { text: "Locked", color: "text-muted" };
    switch (status) {
      case "COMPLETED":
        return { text: "Complete", color: "text-success" };
      case "IN_PROGRESS":
        return { text: "In Progress", color: "text-accent" };
      default:
        return { text: "Not Started", color: "text-muted" };
    }
  };

  const round1Display = getStatusDisplay(round1Status);
  const round2Display = getStatusDisplay(round2Status, round2Locked);

  const getButtonText = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "Review";
      case "IN_PROGRESS":
        return "Continue";
      default:
        return "Start";
    }
  };

  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-4">{partnerName}</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm">What are you aiming for?</span>
          <span className={`font-medium ${round1Display.color}`}>
            {round1Display.text}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm">Your contribution to the team</span>
          <span className={`font-medium ${round2Display.color}`}>
            {round2Display.text}
          </span>
        </div>
      </div>
      <div className="mt-6 space-y-2">
        {round1Status !== "COMPLETED" && round1SessionId && (
          <Link
            href={`/session/${round1SessionId}`}
            className="btn-primary block text-center w-full"
          >
            {getButtonText(round1Status)} Session
          </Link>
        )}
        {round1Status === "COMPLETED" && !round2Locked && round2SessionId && (
          <Link
            href={`/session/${round2SessionId}`}
            className="btn-primary block text-center w-full"
          >
            {getButtonText(round2Status)} Session
          </Link>
        )}
        {round2Locked && round1Status === "COMPLETED" && (
          <p className="text-sm text-muted text-center">
            {round2LockedReason === "document"
              ? "View Your Real Needs document first"
              : "Waiting for partner to complete their session"}
          </p>
        )}
      </div>
    </div>
  );
}

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { partnerAName, partnerBName, id: userId } = session.user;

  // Fetch user to get discoveryViewedAt
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { discoveryViewedAt: true },
  });

  const progress = await getSessionProgress(userId);
  const documents = await getDocuments(userId);

  const discoveryDoc = documents.find((d) => d.type === "DISCOVERY");
  const finalSynthesis = documents.find((d) => d.type === "FINAL_SYNTHESIS");

  // Round 2 is locked if:
  // 1. Both Round 1 sessions not complete, OR
  // 2. Discovery doc exists but hasn't been viewed
  const discoveryViewed = !!user?.discoveryViewedAt;
  const round2Locked = !progress.bothRound1Complete || (!!discoveryDoc && !discoveryViewed);

  return (
    <div className="min-h-screen">
      <header className="bg-card border-b border-border p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              Leadership in Love
            </h1>
            <p className="text-muted">
              Welcome back, {partnerAName} &amp; {partnerBName}
            </p>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Leadership Over Your Goals</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <SessionCard
              partnerName={partnerAName}
              round1Status={progress.round1A?.status || "NOT_STARTED"}
              round2Status={progress.round2A?.status || "NOT_STARTED"}
              round2Locked={round2Locked}
              round2LockedReason={
                !progress.bothRound1Complete
                  ? "partner"
                  : discoveryDoc && !discoveryViewed
                  ? "document"
                  : undefined
              }
              round1SessionId={progress.round1A?.id}
              round2SessionId={progress.round2A?.id}
            />
            <SessionCard
              partnerName={partnerBName}
              round1Status={progress.round1B?.status || "NOT_STARTED"}
              round2Status={progress.round2B?.status || "NOT_STARTED"}
              round2Locked={round2Locked}
              round2LockedReason={
                !progress.bothRound1Complete
                  ? "partner"
                  : discoveryDoc && !discoveryViewed
                  ? "document"
                  : undefined
              }
              round1SessionId={progress.round1B?.id}
              round2SessionId={progress.round2B?.id}
            />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6">Documents</h2>
          <div className="card">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <div>
                  <h3 className="font-semibold">Your Real Needs</h3>
                  <p className="text-sm text-muted">
                    {discoveryDoc
                      ? "Discover what each of you truly needs"
                      : "Available after both partners complete session 1"}
                  </p>
                </div>
                {discoveryDoc ? (
                  <div className="flex gap-2">
                    <Link
                      href={`/document/${discoveryDoc.id}`}
                      className="btn-secondary text-sm py-2"
                    >
                      View
                    </Link>
                    {discoveryDoc.pdfUrl && (
                      <a
                        href={discoveryDoc.pdfUrl}
                        className="btn-accent text-sm py-2"
                        download
                      >
                        Download PDF
                      </a>
                    )}
                  </div>
                ) : progress.bothRound1Complete ? (
                  <GenerateDocumentButton
                    documentType="DISCOVERY"
                    label="Generate Document"
                  />
                ) : (
                  <span className="text-muted">Waiting...</span>
                )}
              </div>

              <div className="flex justify-between items-center py-3">
                <div>
                  <h3 className="font-semibold">Your Commitments</h3>
                  <p className="text-sm text-muted">
                    {finalSynthesis
                      ? "Your roadmap for supporting each other"
                      : "Available after both partners complete session 2"}
                  </p>
                </div>
                {finalSynthesis ? (
                  <div className="flex gap-2">
                    <Link
                      href={`/document/${finalSynthesis.id}`}
                      className="btn-secondary text-sm py-2"
                    >
                      View
                    </Link>
                    {finalSynthesis.pdfUrl && (
                      <a
                        href={finalSynthesis.pdfUrl}
                        className="btn-accent text-sm py-2"
                        download
                      >
                        Download PDF
                      </a>
                    )}
                  </div>
                ) : progress.bothRound2Complete ? (
                  <GenerateDocumentButton
                    documentType="FINAL_SYNTHESIS"
                    label="Generate Document"
                  />
                ) : (
                  <span className="text-muted">Waiting...</span>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
