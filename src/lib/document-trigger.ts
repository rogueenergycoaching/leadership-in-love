import { prisma } from "./prisma";
import {
  generateDiscoveryDocument,
  generateFinalSynthesis,
} from "./document-generator";

export async function checkAndGenerateDocuments(userId: string): Promise<void> {
  const sessions = await prisma.session.findMany({
    where: { userId },
  });

  const round1Sessions = sessions.filter((s) => s.round === "ROUND_1");
  const round2Sessions = sessions.filter((s) => s.round === "ROUND_2");

  const bothRound1Complete = round1Sessions.every(
    (s) => s.status === "COMPLETED"
  );
  const bothRound2Complete = round2Sessions.every(
    (s) => s.status === "COMPLETED"
  );

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
        console.log(`Discovery document generated for user ${userId}`);
      } catch (error) {
        console.error("Failed to generate Discovery document:", error);
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
          console.error("Failed to generate Discovery document:", error);
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
        console.log(`Final Synthesis generated for user ${userId}`);
      } catch (error) {
        console.error("Failed to generate Final Synthesis:", error);
      }
    }
  }
}
