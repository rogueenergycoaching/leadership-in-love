import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./prisma";

const anthropic = new Anthropic();

interface Message {
  role: string;
  content: string;
}

interface SessionData {
  partnerName: string;
  messages: Message[];
  round: string;
}

export async function generateDiscoveryDocument(userId: string): Promise<string> {
  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  // Get Round 1 sessions for both partners
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      round: "ROUND_1",
      status: "COMPLETED",
    },
  });

  if (sessions.length !== 2) {
    throw new Error("Both partners must complete Round 1");
  }

  const sessionA = sessions.find((s) => s.partnerRole === "A");
  const sessionB = sessions.find((s) => s.partnerRole === "B");

  if (!sessionA || !sessionB) {
    throw new Error("Missing session data");
  }

  const partnerAData: SessionData = {
    partnerName: user.partnerAName,
    messages: (sessionA.messages as unknown as Message[]) || [],
    round: "ROUND_1",
  };

  const partnerBData: SessionData = {
    partnerName: user.partnerBName,
    messages: (sessionB.messages as unknown as Message[]) || [],
    round: "ROUND_1",
  };

  const prompt = buildDiscoveryPrompt(partnerAData, partnerBData);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type");
  }

  return content.text;
}

export async function generateFinalSynthesis(userId: string): Promise<string> {
  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  // Get all completed sessions
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      status: "COMPLETED",
    },
  });

  const round2Sessions = sessions.filter((s) => s.round === "ROUND_2");
  if (round2Sessions.length !== 2) {
    throw new Error("Both partners must complete Round 2");
  }

  // Get the Discovery Document for context
  const discoveryDoc = await prisma.document.findFirst({
    where: { userId, type: "DISCOVERY" },
  });

  const sessionA_R1 = sessions.find(
    (s) => s.partnerRole === "A" && s.round === "ROUND_1"
  );
  const sessionB_R1 = sessions.find(
    (s) => s.partnerRole === "B" && s.round === "ROUND_1"
  );
  const sessionA_R2 = sessions.find(
    (s) => s.partnerRole === "A" && s.round === "ROUND_2"
  );
  const sessionB_R2 = sessions.find(
    (s) => s.partnerRole === "B" && s.round === "ROUND_2"
  );

  if (!sessionA_R1 || !sessionB_R1 || !sessionA_R2 || !sessionB_R2) {
    throw new Error("Missing session data");
  }

  const allSessionsData = {
    partnerAName: user.partnerAName,
    partnerBName: user.partnerBName,
    round1A: (sessionA_R1.messages as unknown as Message[]) || [],
    round1B: (sessionB_R1.messages as unknown as Message[]) || [],
    round2A: (sessionA_R2.messages as unknown as Message[]) || [],
    round2B: (sessionB_R2.messages as unknown as Message[]) || [],
    discoveryDocument: discoveryDoc?.content || "",
  };

  const prompt = buildSynthesisPrompt(allSessionsData);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type");
  }

  return content.text;
}

function buildDiscoveryPrompt(
  partnerA: SessionData,
  partnerB: SessionData
): string {
  const formatConversation = (data: SessionData) => {
    return data.messages
      .map((m) => `${m.role === "user" ? data.partnerName : "Coach"}: ${m.content}`)
      .join("\n\n");
  };

  return `You are creating a Discovery Document for a couple who have each completed individual coaching sessions about their shared goals.

## Your Task
Analyze both conversations and create a document that:
1. Identifies where their visions align (2-4 shared goals/themes)
2. Surfaces differences with curiosity, not judgment (1-3 areas)
3. Summarizes each partner's individual priorities
4. Suggests themes worth exploring together

## ${partnerA.partnerName}'s Conversation:
${formatConversation(partnerA)}

## ${partnerB.partnerName}'s Conversation:
${formatConversation(partnerB)}

## Output Format
Create the document in Markdown format following this structure:

# Discovery Document
## ${partnerA.partnerName} & ${partnerB.partnerName}
### Your Shared Goals — What We Discovered

---

## Where Your Visions Align

[For each aligned goal (2-4), include:
- What the goal is
- How ${partnerA.partnerName} described it (use their actual words)
- How ${partnerB.partnerName} described it (use their actual words)
- The shared emotional resonance]

---

## Where Your Perspectives Differ

[For each difference (1-3), include:
- What ${partnerA.partnerName} emphasized
- What ${partnerB.partnerName} emphasized
- A curious question for the couple to discuss together]

---

## Individual Priorities

### What matters most to ${partnerA.partnerName}:
[Summarize their key personal goal/emphasis]

### What matters most to ${partnerB.partnerName}:
[Summarize their key personal goal/emphasis]

---

## Looking Forward

Based on what you've both shared, here are themes worth exploring together:
- [Theme 1]
- [Theme 2]
- [Theme 3]

In Round 2, you'll each explore how you can contribute to these goals — both the shared ones and those that matter especially to your partner.

---

*This document was generated based on your individual conversations. The insights here are starting points for deeper discussion.*

Now generate the Discovery Document:`;
}

function buildSynthesisPrompt(data: {
  partnerAName: string;
  partnerBName: string;
  round1A: Message[];
  round1B: Message[];
  round2A: Message[];
  round2B: Message[];
  discoveryDocument: string;
}): string {
  const formatConversation = (messages: Message[], name: string) => {
    return messages
      .map((m) => `${m.role === "user" ? name : "Coach"}: ${m.content}`)
      .join("\n\n");
  };

  return `You are creating a Final Synthesis document for a couple who have completed all their coaching sessions.

## Context
This couple has completed:
- Round 1: Each partner explored their shared dreams and goals
- Discovery Document: Showed where they align and differ
- Round 2: Each partner explored how to contribute and support each other

## Your Task
Create an inspiring, action-oriented roadmap that:
1. Celebrates the goals that unite them
2. Documents specific commitments each partner made
3. Addresses obstacles with practical solutions
4. Captures what teamwork looks like for them
5. Provides concrete next steps

## Discovery Document:
${data.discoveryDocument}

## ${data.partnerAName}'s Round 1 Conversation:
${formatConversation(data.round1A, data.partnerAName)}

## ${data.partnerBName}'s Round 1 Conversation:
${formatConversation(data.round1B, data.partnerBName)}

## ${data.partnerAName}'s Round 2 Conversation:
${formatConversation(data.round2A, data.partnerAName)}

## ${data.partnerBName}'s Round 2 Conversation:
${formatConversation(data.round2B, data.partnerBName)}

## Output Format
Create the document in Markdown format:

# Your Shared Vision
## A Roadmap for ${data.partnerAName} & ${data.partnerBName}

---

## The Goals That Unite You

[List 2-4 shared goals with energizing descriptions. For each:
- Why it matters to both
- The emotional fire behind it]

---

## Your Individual Commitments

### ${data.partnerAName} commits to:
- [Specific contribution to shared goal]
- [Support for ${data.partnerBName}'s individual goal]
- [Practical action they proposed]

### ${data.partnerBName} commits to:
- [Specific contribution to shared goal]
- [Support for ${data.partnerAName}'s individual goal]
- [Practical action they proposed]

---

## Navigating Today's Challenges

[For each major obstacle identified:]

### The Challenge: [Obstacle name]
- ${data.partnerAName}'s solutions
- ${data.partnerBName}'s solutions
- **Suggestion**: [One synthesized practical recommendation]

---

## Working as a Team

Based on what you've both shared, here's what strong teamwork looks like for you:
[Synthesis of team dynamics both described]

What you each need from the other:
- ${data.partnerAName} needs: [summarized]
- ${data.partnerBName} needs: [summarized]

---

## Your Next Steps

1. [Specific action for this week]
2. [Specific action for this month]
3. [Longer-term milestone]

---

## A Note on Leadership

You've both stepped up by doing this work. Relationship goals don't happen by accident — they require intention, communication, and follow-through. You're leading your relationship, together.

Keep this document somewhere you'll see it. Revisit it in a month. Check in on your commitments. Celebrate progress.

---

*This synthesis was created based on your individual conversations. It represents a starting point — the real work happens in how you show up for each other every day.*

---

**Leadership in Love**

Now generate the Final Synthesis:`;
}
