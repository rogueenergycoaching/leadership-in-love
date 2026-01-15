# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

<!-- Add commands as the project develops, e.g.:
- npm install / pip install -r requirements.txt
- npm run dev / python main.py
- npm test / pytest
-->

## Architecture

## Project Overview

Build a web application for **Leadership in Love**, a relationship coaching platform. This MVP focuses on a single module: **Goal Setting** — helping couples reconnect with their shared life goals, recharge them with new meaning, and develop practical strategies to pursue them together.

The core mechanism: each partner has private AI-guided conversations. The AI then synthesizes both perspectives into shared documents that highlight common ground, surface differences with curiosity, and provide actionable guidance.

---

## Tech Stack

- **Frontend**: Next.js (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL) via Prisma
- **Authentication**: NextAuth.js with email/password (credentials provider)
- **AI**: Claude API (Anthropic)
- **PDF Generation**: @react-pdf/renderer or similar
- **Hosting**: Vercel
- **Version Control**: GitHub (deploy to Vercel via GitHub integration)
- **State Management**: React Context or Zustand for session state

### Infrastructure Setup
1. Create GitHub repository for version control
2. Create Supabase project for database
3. Connect GitHub repo to Vercel for automatic deployments
4. Configure environment variables in Vercel

---

## Data Model

### User (represents a couple, shared login)
```
User {
  id: string (uuid)
  email: string (unique)
  passwordHash: string
  partnerAName: string
  partnerBName: string
  createdAt: datetime
  updatedAt: datetime
}
```

### Session (one AI conversation session)
```
Session {
  id: string (uuid)
  userId: string (foreign key → User)
  partnerRole: enum ('A' | 'B')
  round: enum ('ROUND_1' | 'ROUND_2')
  status: enum ('NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED')
  messages: JSON (array of {role: 'user'|'assistant', content: string})
  questionCount: int (tracks how many substantive questions asked)
  insights: JSON (structured data extracted by AI during conversation)
  startedAt: datetime (nullable)
  completedAt: datetime (nullable)
  createdAt: datetime
  updatedAt: datetime
}
```

### Document (generated outputs)
```
Document {
  id: string (uuid)
  userId: string (foreign key → User)
  type: enum ('DISCOVERY' | 'FINAL_SYNTHESIS')
  content: text (markdown or structured content)
  pdfUrl: string (nullable, path to generated PDF)
  createdAt: datetime
}
```

---

## User Flow

### 1. Registration & Setup
1. User visits the app → sees landing/login page with "Leadership in Love" branding
2. New user clicks "Get Started" → registration form:
   - Email
   - Password
   - Partner A's first name
   - Partner B's first name
3. After registration → redirected to Dashboard

### 2. Dashboard
The dashboard is the central hub. It shows:

```
┌─────────────────────────────────────────────────────────────────┐
│  Leadership in Love                                             │
│  Welcome back, [Partner A name] & [Partner B name]              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GOAL SETTING MODULE                                            │
│                                                                 │
│  ┌─────────────────────┐    ┌─────────────────────┐            │
│  │ [Partner A name]    │    │ [Partner B name]    │            │
│  │                     │    │                     │            │
│  │ Round 1: ✓ Complete │    │ Round 1: In Progress│            │
│  │ Round 2: Not started│    │ Round 2: Locked     │            │
│  │                     │    │                     │            │
│  │ [Continue Session]  │    │ [Continue Session]  │            │
│  └─────────────────────┘    └─────────────────────┘            │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  DOCUMENTS                                                      │
│                                                                 │
│  Discovery Document: Available ✓  [View] [Download PDF]         │
│  Final Synthesis: Waiting for Round 2 completion                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Dashboard Logic:**
- Round 2 is "Locked" until both partners complete Round 1
- Discovery Document appears only after both complete Round 1
- Final Synthesis appears only after both complete Round 2
- Each partner can see the other's progress status
- "Continue Session" button resumes where they left off

### 3. Partner Selection
When clicking "Start Session" or "Continue Session":
- If session not started: show partner selection screen ("Who is completing this session?")
- If session in progress: resume directly into the conversation

### 4. AI Conversation Interface
A clean chat interface:
- Messages displayed in a scrolling container
- Text input at bottom
- Subtle progress indicator ("Question 3 of ~8-12")
- "Save & Exit" button (persists state, returns to dashboard)
- Session auto-saves after each exchange

### 5. Session Completion
When AI determines session is complete:
- Display a completion message
- Thank the user
- If partner hasn't completed their session yet: "Encourage [Partner name] to complete their session so you can receive your Discovery Document"
- If both complete: "Your Discovery Document is now ready! Return to dashboard to view it."
- Button to return to dashboard

### 6. Document Viewing
- Documents displayed in a clean reading view (rendered markdown)
- Download as PDF button
- Option to email to self (nice-to-have, can defer)

---

## AI Conversation Design

### General Principles
- **Warm, curious, non-judgmental tone**
- **Leadership framing**: The user is a leader investing in their relationship, not a patient being fixed
- **Structured but natural**: Follow the question sequence, but respond naturally to what they share
- **Excavation mindset**: Don't accept surface answers. Gently probe deeper when responses are vague or generic
- **Capture language**: Note the specific words, phrases, and metaphors the user employs
- **Stay on topic**: The AI must keep the conversation focused on the module topic (Goal Setting). If the user tries to ask unrelated questions, request help with other tasks, or use the chat as a general assistant, the AI should warmly but firmly redirect back to the session.

### Staying On Topic — Handling Off-Topic Requests

The AI is a guided coaching tool, not a general assistant. If users attempt to go off-topic, the AI should redirect politely:

**Examples of off-topic attempts:**
- "Can you help me write an email?"
- "What's the weather like today?"
- "Tell me a joke"
- "Can you help me with a work problem?"
- "What do you think about [political topic]?"

**Redirect response pattern:**
> "I'm here specifically to help you and [Partner name] explore your shared goals. Let's stay focused on that — it's valuable work. [Return to the current question or theme]"

If the user persists:
> "I understand, but this session is designed for one purpose: helping you reconnect with your relationship goals. For other questions, you'd need a different tool. Now, [return to topic]..."

The AI should never:
- Answer general knowledge questions
- Perform tasks unrelated to the coaching module
- Engage in casual chat beyond brief pleasantries
- Provide advice on topics outside the session scope

### Round 1: Rediscovering Shared Goals (8-12 questions)

**Purpose**: Understand each partner's perspective on their early relationship goals and what those goals mean today.

**Opening:**
> Welcome, [Name]. I'm here to help you and [Partner name] reconnect with the goals and dreams you share. This conversation is just between us — your partner will have their own separate conversation. Take your time, and answer honestly. There are no wrong answers.
>
> Let's start by going back to when you and [Partner name] first decided to build a life together...

**Question Themes (in order):**

1. **Early Dreams**
   - What were the dreams and goals you shared when you first got together?
   - What did you imagine your life together would look like?

2. **Personal Meaning**
   - Which of those goals mattered most to *you* personally? Why?
   - What would achieving that goal have meant for you?

3. **Current Reality**
   - Looking at your life today, how do those early goals show up now?
   - Which goals have you achieved? Which feel distant?

4. **Emotional Resonance Today**
   - When you think about those early dreams now, what do you feel?
   - Is there a goal that still excites you when you imagine it?

5. **Renewed Vision**
   - If you could breathe new life into one shared goal, which would it be?
   - What would your relationship look like if you were actively pursuing that together?

6. **Partner Perception**
   - What do you think [Partner name] would say their most important shared goal is?
   - How do you think they feel about the goals you've mentioned?

7. **Obstacles & Realities**
   - What gets in the way of pursuing these goals in your current life?
   - What would need to change to make space for them?

8. **Commitment**
   - What's one thing you'd be willing to do differently to move toward a shared goal?

**AI Behavior During Round 1:**
- Minimum 8 questions, maximum 12
- Track question count internally
- If an answer is vague ("I don't know" / "I guess it was fine"), probe gently:
  - "Can you think of a specific moment that captures that feeling?"
  - "What comes up for you when you sit with that question?"
  - "If you had to guess, what might you say?"
- Extract and store:
  - Named goals (explicit statements)
  - Emotional associations with each goal
  - Perceived obstacles
  - Language patterns and key phrases
  - Perception of partner's views

**Closing Round 1:**
> Thank you for sharing so openly, [Name]. This gives a real picture of what matters to you and how you see your shared goals with [Partner name].
>
> Once [Partner name] completes their session, I'll create a Discovery Document that shows where your visions align and where they differ. You'll find it on your dashboard.
>
> [Return to Dashboard]

---

### Discovery Document Generation

**Trigger**: Both partners complete Round 1

**Content Structure:**

```markdown
# Discovery Document
## [Partner A name] & [Partner B name]
### Your Shared Goals — What We Discovered

---

## Where Your Visions Align

[Identify 2-4 goals or themes that both partners mentioned]

For each aligned goal:
- What the goal is
- How Partner A described it (using their language)
- How Partner B described it (using their language)
- The shared emotional resonance

---

## Where Your Perspectives Differ

[Identify 1-3 areas of difference — with curiosity, not judgment]

For each difference:
- What Partner A emphasized
- What Partner B emphasized
- A curious question for the couple to discuss

---

## Individual Priorities

### What matters most to [Partner A name]:
[Summarize their key personal goal/emphasis]

### What matters most to [Partner B name]:
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
```

---

### Round 2: Contribution & Strategy (6-9 questions)

**Trigger**: Both partners complete Round 1, Discovery Document generated

**Purpose**: 
- Explore differences with curiosity
- Identify how each partner can contribute to shared AND partner-specific goals
- Surface practical challenges and solutions

**Opening:**
> Welcome back, [Name]. You've now both completed the first round, and your Discovery Document is available.
>
> In this session, we'll go deeper — exploring how you can each contribute to your shared goals, and how you might support [Partner name] in the goals that matter especially to them, even if they're not your top priority.

**Question Themes:**

1. **Response to Discovery Document**
   - What stood out to you from the Discovery Document?
   - Were there any surprises in how [Partner name] sees your shared goals?

2. **Exploring Differences** (reference specific differences from document)
   - The document noted that [Partner A] emphasizes X while [Partner B] emphasizes Y. What do you make of that difference?
   - How do you feel about [Partner name]'s priority around [their specific goal]?

3. **Contribution to Shared Goals**
   - For [shared goal], what could you personally contribute?
   - What strengths do you bring that would help you both get there?

4. **Supporting Partner's Individual Goals**
   - [Partner name] expressed that [their personal goal] is important to them. Even if it's not your top priority, how might you support them in this?
   - What's a practical thing you could do to make space for this in your lives?

5. **Obstacles Today**
   - What are the biggest obstacles to pursuing these goals in your current life? (busy schedules, kids, work, energy)
   - Which obstacle feels most stubborn?

6. **Practical Solutions**
   - What are 3 practical things that could help you get around [obstacle]?
   - What's one small change you could make this week?

7. **Team Mindset**
   - What would it look like for you and [Partner name] to really operate as a team on these goals?
   - What would you need from each other?

**AI Behavior During Round 2:**
- Minimum 6 questions, maximum 9
- Reference the Discovery Document content specifically
- Ask about at least one area of difference
- Ask about contribution to at least one partner-specific goal
- Extract and store:
  - Proposed contributions
  - Identified obstacles
  - Practical solutions
  - Team dynamics observations

**Closing Round 2:**
> Thank you, [Name]. You've really engaged with what it means to pursue these goals as a team.
>
> Once [Partner name] completes their session, I'll create your Final Synthesis — a document that brings together your shared goals, the contributions you've each committed to, and a practical path forward.
>
> [Return to Dashboard]

---

### Final Synthesis Document (PDF)

**Trigger**: Both partners complete Round 2

**Tone**: Inspiring, action-oriented, leadership-focused

**Content Structure:**

```markdown
# Your Shared Vision
## A Roadmap for [Partner A name] & [Partner B name]

---

## The Goals That Unite You

[List 2-4 shared goals with energizing descriptions]

For each goal:
- Why it matters to both of you
- The fire behind it (emotional resonance captured from conversations)

---

## Your Individual Commitments

### [Partner A name] commits to:
- [Specific contribution to shared goal]
- [Support for Partner B's individual goal]
- [Practical action they proposed]

### [Partner B name] commits to:
- [Specific contribution to shared goal]
- [Support for Partner A's individual goal]
- [Practical action they proposed]

---

## Navigating Today's Challenges

You both identified obstacles. Here's what you've proposed:

### The Challenge: [Obstacle 1, e.g., "Busy schedules with kids"]
- [Partner A's solutions]
- [Partner B's solutions]
- **Suggestion from us**: [One synthesized practical recommendation]

### The Challenge: [Obstacle 2]
...

---

## Working as a Team

Based on what you've both shared, here's what strong teamwork looks like for you:
- [Synthesis of team dynamics both described]

What you each need from the other:
- [Partner A] needs: [summarized]
- [Partner B] needs: [summarized]

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

Leadership in Love
www.leadershipinlove.com
```

---

## API Routes

### Authentication
- `POST /api/auth/register` — Create new user
- `POST /api/auth/[...nextauth]` — NextAuth handlers

### Sessions
- `GET /api/sessions` — Get all sessions for current user
- `POST /api/sessions` — Create new session
- `GET /api/sessions/[id]` — Get specific session
- `PATCH /api/sessions/[id]` — Update session (save messages, status)

### Conversations
- `POST /api/chat` — Send message to AI, receive response
  - Input: `{ sessionId, message }`
  - Output: `{ response, sessionComplete, questionCount }`
  - This route handles all AI logic: maintaining context, tracking questions, determining completion

### Documents
- `GET /api/documents` — Get all documents for current user
- `POST /api/documents/generate` — Trigger document generation (called automatically when conditions met)
- `GET /api/documents/[id]/pdf` — Generate and return PDF

---

## AI Implementation Details

### System Prompt Structure

Each AI call should include:
1. **Base system prompt** — Role, tone, principles
2. **Round-specific instructions** — What to achieve, question themes
3. **Session context** — Partner names, which partner this is, what's been discussed
4. **Conversation history** — All previous messages in session
5. **Extracted insights so far** — Structured data from conversation

### Tracking Questions

The AI should track "substantive questions asked" (not follow-up probes). Use a structured approach:
- After each AI response, classify: Was this a new substantive question (progressing through themes) or a follow-up/probe?
- Store question count in session
- When count reaches minimum (8 for R1, 6 for R2) and key themes covered, AI can conclude
- Never exceed maximum (12 for R1, 9 for R2)

### Insight Extraction

After each user response, the AI should update a structured `insights` object:

```json
{
  "namedGoals": [
    { "goal": "Travel together", "emotionalResonance": "Freedom, adventure", "priority": "high" }
  ],
  "perceivedObstacles": ["Busy work schedules", "Kid activities"],
  "partnerPerceptions": { "whatPartnerValues": "Financial security", "howPartnerFeels": "Stressed" },
  "keyPhrases": ["We used to dream about...", "Life got in the way"],
  "contributions": [],
  "solutions": []
}
```

This structured data feeds into document generation.

---

## UI/UX Notes

### Design Direction
- Clean, modern, professional
- Warm but not overly soft — appeals to both men and women
- Primary color: Deep blue or teal (suggests trust, depth, leadership)
- Accent color: Warm gold or amber (suggests warmth, value)
- Typography: Clean sans-serif (Inter, or similar)
- Plenty of white space
- No generic stock imagery

### Key Screens
1. **Landing/Login** — Simple, welcoming, "Leadership in Love" prominent
2. **Registration** — Minimal form, clear progress
3. **Dashboard** — Clear status, obvious next actions
4. **Partner Selection** — Simple choice between two names
5. **Chat Interface** — Clean, focused, minimal distractions
6. **Document View** — Readable, well-formatted, download prominent

### Mobile Considerations (Future)
- Current build: Optimize for desktop
- Structure components to be responsive-ready
- Chat interface should work reasonably on tablet

---

## Out of Scope for MVP

- Payment integration
- Email delivery of documents
- Mobile-optimized UI
- Multiple modules (only Goal Setting)
- Coach dashboard / reports
- Automatic data deletion
- Social login
- Password reset flow (manual for MVP)

---

## Development Phases

### Phase 1: Foundation
- Project setup (Next.js, Tailwind, Prisma)
- Database schema
- Authentication (register, login, logout)
- Basic dashboard layout

### Phase 2: Session Management
- Create/resume sessions
- Partner selection flow
- Session persistence
- Progress tracking on dashboard

### Phase 3: AI Conversation
- Chat interface
- Claude API integration
- Round 1 conversation flow
- Session completion detection
- Insight extraction

### Phase 4: Document Generation
- Discovery Document generation (after both R1 complete)
- Document viewing UI
- Round 2 conversation flow
- Final Synthesis generation
- PDF export

### Phase 5: Polish
- Error handling
- Loading states
- UI refinement
- Testing with real conversations

---

## Environment Variables Needed

```
# Database (Supabase)
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]?pgbouncer=true
DIRECT_URL=postgresql://[user]:[password]@[host]:[port]/[database]

# Authentication
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# AI
ANTHROPIC_API_KEY=
```

Note: Supabase provides both a pooled connection (DATABASE_URL with pgbouncer) and a direct connection (DIRECT_URL). Prisma needs both for migrations and runtime queries.

---

## Notes for Claude Code

1. **Start with the data model** — Get Prisma schema right first
2. **Build incrementally** — Each phase should result in working software
3. **AI prompts are living documents** — Structure them so they're easy to edit
4. **The conversation flow is the core product** — Invest in getting the AI interaction right
5. **Session persistence is critical** — Users must be able to resume mid-conversation
6. **Document generation is a synthesis task** — The AI needs access to both partners' extracted insights

When building the AI conversation handling:
- Use streaming for better UX (show response as it generates)
- Maintain clear separation between conversation logic and UI
- Store the full conversation in the session, but also extract structured insights
- The AI should reference extracted insights when generating documents

---

## Success Criteria

The MVP is complete when:
1. A couple can register and log in with shared credentials
2. Each partner can complete Round 1 individually, with conversations persisted
3. After both complete Round 1, a Discovery Document is automatically generated and viewable
4. Each partner can complete Round 2
5. After both complete Round 2, a Final Synthesis is generated as downloadable PDF
6. The AI conversations feel natural, warm, and genuinely excavate insights
7. The documents are coherent, personalized, and actionable
