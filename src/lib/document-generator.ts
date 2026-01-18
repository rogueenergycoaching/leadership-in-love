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

interface Pronouns {
  subject: string;
  object: string;
  possessive: string;
}

function getPronouns(gender: string | null): Pronouns {
  switch (gender) {
    case "MALE":
      return { subject: "he", object: "him", possessive: "his" };
    case "FEMALE":
      return { subject: "she", object: "her", possessive: "her" };
    default:
      return { subject: "they", object: "them", possessive: "their" };
  }
}

/**
 * Regenerate the Discovery document with revision feedback incorporated.
 * Used when a user indicates the document was inaccurate.
 */
export async function regenerateDiscoveryDocument(
  userId: string,
  originalDocument: string,
  revisionFeedback: string
): Promise<string> {
  // Get user info including gender
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

  const pronounsA = getPronouns(user.partnerAGender);
  const pronounsB = getPronouns(user.partnerBGender);

  const prompt = buildRevisionPrompt(
    partnerAData,
    partnerBData,
    pronounsA,
    pronounsB,
    originalDocument,
    revisionFeedback
  );

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

export async function generateDiscoveryDocument(userId: string): Promise<string> {
  // Get user info including gender
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

  const pronounsA = getPronouns(user.partnerAGender);
  const pronounsB = getPronouns(user.partnerBGender);

  const prompt = buildDiscoveryPrompt(partnerAData, partnerBData, pronounsA, pronounsB);

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
  // Get user info including gender
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

  const pronounsA = getPronouns(user.partnerAGender);
  const pronounsB = getPronouns(user.partnerBGender);

  // Extract sprint preferences and selected goals from Round 2 sessions
  const sprintPrefA = sessionA_R2.sprintPreference || "FULL";
  const sprintPrefB = sessionB_R2.sprintPreference || "FULL";
  const selectedGoalsA = sessionA_R2.selectedGoals as string[] | null;
  const selectedGoalsB = sessionB_R2.selectedGoals as string[] | null;

  const allSessionsData = {
    partnerAName: user.partnerAName,
    partnerBName: user.partnerBName,
    pronounsA,
    pronounsB,
    round1A: (sessionA_R1.messages as unknown as Message[]) || [],
    round1B: (sessionB_R1.messages as unknown as Message[]) || [],
    round2A: (sessionA_R2.messages as unknown as Message[]) || [],
    round2B: (sessionB_R2.messages as unknown as Message[]) || [],
    discoveryDocument: discoveryDoc?.content || "",
    sprintPreferenceA: sprintPrefA,
    sprintPreferenceB: sprintPrefB,
    selectedGoalsA,
    selectedGoalsB,
  };

  const prompt = buildSynthesisPrompt(allSessionsData);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6000,
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
  partnerB: SessionData,
  pronounsA: Pronouns,
  pronounsB: Pronouns
): string {
  const formatConversation = (data: SessionData) => {
    return data.messages
      .map((m) => `${m.role === "user" ? data.partnerName : "Coach"}: ${m.content}`)
      .join("\n\n");
  };

  return `You are creating "Your Real Needs" - a document for a couple who have each completed individual coaching sessions about their shared goals.

## CRITICAL PRINCIPLE: No Verbatim Quoting
NEVER quote either partner's words directly. Instead:
- Synthesize and translate what they shared
- Capture the essence of their meaning
- Use your own words to describe their perspective
- Focus on the underlying needs and values, not surface statements

## Pronouns
For ${partnerA.partnerName}, use: ${pronounsA.subject}/${pronounsA.object}/${pronounsA.possessive}
For ${partnerB.partnerName}, use: ${pronounsB.subject}/${pronounsB.object}/${pronounsB.possessive}

## Your Task
Analyze both conversations and create a document with 6 sections:
1. Your Shared Vision - where they are aligned
2. Where Your Perspectives Differ - presented with curiosity, not judgment
3. Individual Priorities - what matters most to each
4. How You Each Experience Support - translate support needs for the partner to understand
5. What You Might Not Have Known - surprising insights about each other
6. Looking Forward - themes to explore together

## ${partnerA.partnerName}'s Conversation:
${formatConversation(partnerA)}

## ${partnerB.partnerName}'s Conversation:
${formatConversation(partnerB)}

## Output Format
Create the document in Markdown format following this structure:

# Your Real Needs
## ${partnerA.partnerName} & ${partnerB.partnerName}

---

## Your Shared Vision

Where you're aligned in what you want to build together.

[For each aligned goal/theme (2-4), include:
- The shared aspiration (synthesized, not quoted)
- Why it matters to both of you
- The emotional resonance you both expressed]

---

## Where Your Perspectives Differ

These differences aren't problems — they're opportunities to understand each other more deeply.

[For each difference (1-3):
- What ${partnerA.partnerName} emphasizes and why it matters to ${pronounsA.object}
- What ${partnerB.partnerName} emphasizes and why it matters to ${pronounsB.object}
- A curious question to explore together]

---

## Individual Priorities

### ${partnerA.partnerName}'s Core Focus:
[Synthesize what matters most to ${pronounsA.object} - the deeper need underneath the goals ${pronounsA.subject} mentioned]

### ${partnerB.partnerName}'s Core Focus:
[Synthesize what matters most to ${pronounsB.object} - the deeper need underneath the goals ${pronounsB.subject} mentioned]

---

## How You Each Experience Support

Understanding what "support" really means to each of you.

### What ${partnerA.partnerName} needs from ${partnerB.partnerName}:
[Translate ${pronounsA.possessive} support needs into actionable terms that ${partnerB.partnerName} can understand and act on]

### What ${partnerB.partnerName} needs from ${partnerA.partnerName}:
[Translate ${pronounsB.possessive} support needs into actionable terms that ${partnerA.partnerName} can understand and act on]

---

## What You Might Not Have Known

Insights that might surprise you about your partner.

### About ${partnerA.partnerName}:
[Something ${partnerB.partnerName} might not have fully understood about what drives ${partnerA.partnerName}]

### About ${partnerB.partnerName}:
[Something ${partnerA.partnerName} might not have fully understood about what drives ${partnerB.partnerName}]

---

## Looking Forward

Based on what you've both shared, here are themes worth exploring together:
- [Theme 1]
- [Theme 2]
- [Theme 3]

In the next session, you'll each explore how you can take leadership in supporting these goals — both the shared ones and those that matter especially to your partner.

---

*This document synthesizes your individual conversations. The insights here are starting points for deeper understanding — discuss them together.*

Now generate "Your Real Needs":`;
}

function buildSynthesisPrompt(data: {
  partnerAName: string;
  partnerBName: string;
  pronounsA: Pronouns;
  pronounsB: Pronouns;
  round1A: Message[];
  round1B: Message[];
  round2A: Message[];
  round2B: Message[];
  discoveryDocument: string;
  sprintPreferenceA: string;
  sprintPreferenceB: string;
  selectedGoalsA: string[] | null;
  selectedGoalsB: string[] | null;
}): string {
  const formatConversation = (messages: Message[], name: string) => {
    return messages
      .map((m) => `${m.role === "user" ? name : "Coach"}: ${m.content}`)
      .join("\n\n");
  };

  // Determine sprint approach based on preferences
  const getSprintInstructions = () => {
    const prefA = data.sprintPreferenceA;
    const prefB = data.sprintPreferenceB;

    // If both want FULL, give detailed sprint
    // If both want LIGHT, give minimal sprint
    // If mixed, give moderate approach that honors both
    if (prefA === "FULL" && prefB === "FULL") {
      return `
## Your 30-Day Sprint (Full Framework)

For each priority goal, include:

### Goal 1: [Goal Name]

**Success Picture:** What does progress look like in 30 days?

**${data.partnerAName}'s Actions:**
- [Specific action 1]
- [Specific action 2]

**${data.partnerBName}'s Actions:**
- [Specific action 1]
- [Specific action 2]

**Obstacles to Watch For:**
- [Likely obstacle and how to handle it]

**Check-In Questions (for your weekly review):**
- How are we progressing?
- What's getting in the way?
- How can we better support each other?

[Repeat for each priority goal]`;
    } else if (prefA === "LIGHT" && prefB === "LIGHT") {
      return `
## Your 30-Day Focus

### Priority Goals:
${data.selectedGoalsA?.length ? data.selectedGoalsA.map(g => `- ${g}`).join("\n") : "[Goals identified from conversation]"}
${data.selectedGoalsB?.length ? data.selectedGoalsB.map(g => `- ${g}`).join("\n") : ""}

### Your Commitments:
- ${data.partnerAName}: [Key commitment summarized]
- ${data.partnerBName}: [Key commitment summarized]

### Suggested Check-In Rhythm:
Weekly 15-minute check-in: "How are we doing on our goals? How can I support you better this week?"`;
    } else {
      // Mixed preferences - provide moderate approach
      return `
## Your 30-Day Sprint

### Priority Goals for This Month:
${data.selectedGoalsA?.length ? `${data.partnerAName}'s focus: ${data.selectedGoalsA.join(", ")}` : "[Goals from conversation]"}
${data.selectedGoalsB?.length ? `${data.partnerBName}'s focus: ${data.selectedGoalsB.join(", ")}` : ""}

### Key Actions:

**${data.partnerAName} will:**
- [Primary action toward shared goal]
- [Action supporting ${data.partnerBName}'s priority]

**${data.partnerBName} will:**
- [Primary action toward shared goal]
- [Action supporting ${data.partnerAName}'s priority]

### Your Check-In Rhythm:
We recommend a weekly 15-20 minute check-in:
1. What progress did we make this week?
2. What obstacles came up?
3. How can we support each other better?

### Watch Out For:
- [Key obstacle identified] — Plan: [How to handle it]`;
    }
  };

  return `You are creating "Your Commitments" - a document for a couple who have completed all their coaching sessions.

## CRITICAL PRINCIPLE: No Verbatim Quoting
NEVER quote either partner's words directly. Synthesize and translate what they shared.

## Pronouns
For ${data.partnerAName}, use: ${data.pronounsA.subject}/${data.pronounsA.object}/${data.pronounsA.possessive}
For ${data.partnerBName}, use: ${data.pronounsB.subject}/${data.pronounsB.object}/${data.pronounsB.possessive}

## Context
This couple has completed:
- Session 1 ("What are you aiming for?"): Each explored their goals and dreams
- "Your Real Needs" document: Showed where they align and differ
- Session 2 ("Your contribution to the team"): Each explored how to contribute and support each other

## Selected Goals (from Session 2 closing):
${data.selectedGoalsA?.length ? `${data.partnerAName} selected: ${data.selectedGoalsA.join(", ")}` : `${data.partnerAName}: Extract from conversation`}
${data.selectedGoalsB?.length ? `${data.partnerBName} selected: ${data.selectedGoalsB.join(", ")}` : `${data.partnerBName}: Extract from conversation`}

## Sprint Preferences:
${data.partnerAName}: ${data.sprintPreferenceA}
${data.partnerBName}: ${data.sprintPreferenceB}

## Your Real Needs Document:
${data.discoveryDocument}

## ${data.partnerAName}'s Session 1 Conversation:
${formatConversation(data.round1A, data.partnerAName)}

## ${data.partnerBName}'s Session 1 Conversation:
${formatConversation(data.round1B, data.partnerBName)}

## ${data.partnerAName}'s Session 2 Conversation:
${formatConversation(data.round2A, data.partnerAName)}

## ${data.partnerBName}'s Session 2 Conversation:
${formatConversation(data.round2B, data.partnerBName)}

## Output Format
Create the document in Markdown format:

# Your Commitments
## ${data.partnerAName} & ${data.partnerBName}

---

## Your Priority Goals

The goals you've chosen to focus on together.

[List the 2-4 priority goals that emerged from both Session 2 conversations. For each:
- The goal (synthesized)
- Why it matters now
- How you'll approach it as a team]

---

## Your Commitments to Each Other

### ${data.partnerAName} commits to:
- **For shared goals:** [Specific commitment to contribute]
- **For ${data.partnerBName}:** [How ${data.pronounsA.subject} will support ${data.partnerBName}'s individual priorities]
- **In daily life:** [Practical action ${data.pronounsA.subject} proposed]

### ${data.partnerBName} commits to:
- **For shared goals:** [Specific commitment to contribute]
- **For ${data.partnerAName}:** [How ${data.pronounsB.subject} will support ${data.partnerAName}'s individual priorities]
- **In daily life:** [Practical action ${data.pronounsB.subject} proposed]

---

## How You'll Work as a Team

Based on what you've both shared about teamwork and accountability:

**Your Team Operating Style:**
[Synthesize what they both said about how they want to work together]

**What ${data.partnerAName} needs from ${data.partnerBName}:**
[Specific, actionable support needs]

**What ${data.partnerBName} needs from ${data.partnerAName}:**
[Specific, actionable support needs]

---

## Navigating Obstacles

[For each major obstacle they identified:]

### Challenge: [Obstacle]
**Your plan:** [Synthesized approach combining both partners' ideas]

---
${getSprintInstructions()}

---

## A Note on Leadership

You've both stepped up by doing this work. Building a life together doesn't happen by accident — it requires intention, communication, and follow-through. You're not just partners; you're leading your relationship together.

This document is your starting point. Revisit it. Discuss it. Adjust it as you learn. The goals and commitments here aren't set in stone — they're a living agreement between two people who chose to be intentional about their future.

---

## Continue the Conversation

This module was designed by **Mirjam Slokker**, relationship coach and founder of Leadership in Love.

If you'd like to explore these themes more deeply — whether through individual coaching, couple sessions, or workshops — you can reach Mirjam at:

**Email:** mirjam@leadershipinlove.com
**Website:** leadershipinlove.com

---

*Your Commitments was generated based on your individual conversations. It represents your intentions today — the real work happens in how you show up for each other every day.*

**Leadership in Love**

Now generate "Your Commitments":`;
}

function buildRevisionPrompt(
  partnerA: SessionData,
  partnerB: SessionData,
  pronounsA: Pronouns,
  pronounsB: Pronouns,
  originalDocument: string,
  revisionFeedback: string
): string {
  const formatConversation = (data: SessionData) => {
    return data.messages
      .map((m) => `${m.role === "user" ? data.partnerName : "Coach"}: ${m.content}`)
      .join("\n\n");
  };

  return `You are REVISING "Your Real Needs" - a document for a couple who have each completed individual coaching sessions about their shared goals.

## IMPORTANT: Revision Context
One of the partners has indicated that the original document contained inaccuracies or didn't fully capture their perspective. You must incorporate their feedback while maintaining the document's overall structure and quality.

## Partner's Revision Feedback:
"${revisionFeedback}"

## Original Document (to be revised):
${originalDocument}

## CRITICAL PRINCIPLE: No Verbatim Quoting
NEVER quote either partner's words directly. Instead:
- Synthesize and translate what they shared
- Capture the essence of their meaning
- Use your own words to describe their perspective
- Focus on the underlying needs and values, not surface statements

## Pronouns
For ${partnerA.partnerName}, use: ${pronounsA.subject}/${pronounsA.object}/${pronounsA.possessive}
For ${partnerB.partnerName}, use: ${pronounsB.subject}/${pronounsB.object}/${pronounsB.possessive}

## Your Task
1. Carefully review the revision feedback
2. Re-read the original conversations to find what was missed or misrepresented
3. Create a CORRECTED version of the document that addresses the feedback
4. Maintain the same 6-section structure
5. Keep accurate content from the original; only change what needs to be corrected

The 6 sections are:
1. Your Shared Vision - where they are aligned
2. Where Your Perspectives Differ - presented with curiosity, not judgment
3. Individual Priorities - what matters most to each
4. How You Each Experience Support - translate support needs for the partner to understand
5. What You Might Not Have Known - surprising insights about each other
6. Looking Forward - themes to explore together

## ${partnerA.partnerName}'s Original Conversation:
${formatConversation(partnerA)}

## ${partnerB.partnerName}'s Original Conversation:
${formatConversation(partnerB)}

## Output Format
Create the REVISED document in Markdown format, keeping the same structure:

# Your Real Needs
## ${partnerA.partnerName} & ${partnerB.partnerName}

[Follow the same structure as the original, but with corrections based on the feedback]

---

*This document synthesizes your individual conversations. The insights here are starting points for deeper understanding — discuss them together.*

*(Revised based on partner feedback)*

Now generate the REVISED "Your Real Needs":`;
}
