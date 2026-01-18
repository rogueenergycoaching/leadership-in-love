import { prisma } from "./prisma";
import {
  generateDiscoveryDocument,
  generateFinalSynthesis,
} from "./document-generator";

export async function checkAndGenerateDocuments(userId: string): Promise<void> {
  console.log(`Checking document generation for user ${userId}`);

  const sessions = await prisma.session.findMany({
    where: { userId },
  });

  const round1Sessions = sessions.filter((s) => s.round === "ROUND_1");
  const round2Sessions = sessions.filter((s) => s.round === "ROUND_2");

  console.log(`Round 1 sessions: ${round1Sessions.length}, statuses: ${round1Sessions.map(s => s.status).join(', ')}`);
  console.log(`Round 2 sessions: ${round2Sessions.length}, statuses: ${round2Sessions.map(s => s.status).join(', ')}`);

  // Need exactly 2 round 1 sessions, both completed
  const bothRound1Complete = round1Sessions.length === 2 &&
    round1Sessions.every((s) => s.status === "COMPLETED");

  // Need exactly 2 round 2 sessions, both completed
  const bothRound2Complete = round2Sessions.length === 2 &&
    round2Sessions.every((s) => s.status === "COMPLETED");

  console.log(`Both Round 1 complete: ${bothRound1Complete}, Both Round 2 complete: ${bothRound2Complete}`);

  // Check if Discovery document should be generated
  if (bothRound1Complete) {
    const existingDiscovery = await prisma.document.findFirst({
      where: { userId, type: "DISCOVERY" },
    });

    if (!existingDiscovery) {
      try {
        const content = await generateDiscoveryDocument(userId);
        await prisma.document.create({
          data: {
            userId,
            type: "DISCOVERY",
            content,
          },
        });
        console.log(`"Your Real Needs" document generated for user ${userId}`);
      } catch (error) {
        console.error("Failed to generate 'Your Real Needs' document:", error);
      }
    }
  }

  // Check if Final Synthesis should be generated
  if (bothRound1Complete && bothRound2Complete) {
    const existingSynthesis = await prisma.document.findFirst({
      where: { userId, type: "FINAL_SYNTHESIS" },
    });

    if (!existingSynthesis) {
      // Ensure Discovery exists first
      const discoveryDoc = await prisma.document.findFirst({
        where: { userId, type: "DISCOVERY" },
      });

      if (!discoveryDoc) {
        // Generate Discovery first if somehow missing
        try {
          const discoveryContent = await generateDiscoveryDocument(userId);
          await prisma.document.create({
            data: {
              userId,
              type: "DISCOVERY",
              content: discoveryContent,
            },
          });
        } catch (error) {
          console.error("Failed to generate 'Your Real Needs' document:", error);
          return;
        }
      }

      try {
        const content = await generateFinalSynthesis(userId);
        await prisma.document.create({
          data: {
            userId,
            type: "FINAL_SYNTHESIS",
            content,
          },
        });
        console.log(`"Your Commitments" document generated for user ${userId}`);
      } catch (error) {
        console.error("Failed to generate 'Your Commitments' document:", error);
      }
    }
  }
}
