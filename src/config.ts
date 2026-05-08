// ─────────────────────────────────────────────────────────────
//  PRIVY AI STARTER — Configuration
//  Edit this file to customise the app for your use case.
// ─────────────────────────────────────────────────────────────

export const APP_NAME = "YOUR_APP_NAME";
export const APP_TAGLINE = "Your private AI companion";

// The first message displayed when the chat is empty.
export const CHAT_GREETING =
  "Hi! I'm your private AI companion. What's on your mind?";

// Placeholder shown in the message input.
export const CHAT_INPUT_PLACEHOLDER = "Share what's on your mind…";

// System prompt sent to the primary AI model (Privy or Gemini).
// This defines your AI's persona, tone, and scope.
export const SYSTEM_PROMPT =
  "You are a helpful, warm, and thoughtful AI companion. " +
  "Be concise, supportive, and evidence-based where relevant. " +
  "Never give advice that should come from a licensed professional — " +
  "always recommend consulting one when appropriate.";

// Landing page — headline and sub-headline
export const HERO_HEADLINE = "Private AI, built for you.";
export const HERO_SUBHEADLINE =
  "Your personal AI companion — with memory only you can erase, " +
  "and inference that even we can't read.";

// Landing page feature cards
export const FEATURES = [
  {
    title: "Always available",
    body: "A judgment-free space for questions you can't always ask out loud.",
  },
  {
    title: "Evidence-based",
    body: "Grounded answers drawn from reliable sources — not random forums.",
    accent: true,
  },
  {
    title: "Privacy by design",
    body: "Your conversations stay yours. One tap permanently erases every memory.",
  },
  {
    title: "Contextually aware",
    body: "Guidance that adapts to your situation over time.",
  },
];

// Landing page "how it works" steps
export const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Tell it what you need",
    body: "Share your situation, questions, or goals.",
  },
  {
    n: "02",
    title: "Get a specific answer",
    body: "Receive calm, actionable guidance in seconds.",
  },
  {
    n: "03",
    title: "Go deeper with Research",
    body: "Switch to Research mode for cited, source-backed deep dives.",
  },
];

// ─────────────────────────────────────────────────────────────
//  Deep Research mode
// ─────────────────────────────────────────────────────────────

// System prompt for the Research edge function.
// Replace with a domain-specific research prompt for your use case.
export const RESEARCH_SYSTEM_PROMPT = `You are a research AI companion with access to high-quality sources.

How you answer:
1. Lead with a 1–2 sentence direct answer.
2. Provide a structured evidence section citing reliable sources.
3. Attribute claims inline, e.g. "(WHO 2023)" or "(systematic review, 2022)".
4. End with a short Sources list.
5. Add: "This is information, not professional advice."

Style: calm, precise, non-alarmist. Quantify when you can. Acknowledge uncertainty honestly. Never fabricate citations.`;

// Suggested questions shown on the Research empty state.
// Customise these for your domain.
export const RESEARCH_SUGGESTED = [
  "What does the latest evidence say about [topic]?",
  "What are the current guidelines on [condition or practice]?",
  "Summarise the research on [subject] with citations.",
  "What are the evidence-based best practices for [area]?",
];

// Sources shown on the Research empty state.
export const RESEARCH_SOURCES = [
  { name: "PubMed", url: "https://pubmed.ncbi.nlm.nih.gov" },
  { name: "Cochrane", url: "https://www.cochranelibrary.com" },
  { name: "WHO", url: "https://www.who.int" },
  { name: "CDC", url: "https://www.cdc.gov" },
];
