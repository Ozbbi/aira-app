// Daily insights — short, punchy reads designed for the Learn tab and
// Home-tab "today's insight" card. Each is ~80-120 words, B1-B2 English,
// no jargon. Sourced from Anthropic prompt-engineering docs, Lee Boonstra's
// Google whitepaper, and the OpenAI prompt guide.

export interface Insight {
  id: string;
  title: string;
  body: string;        // 2–4 short paragraphs separated by \n\n
  takeaway: string;    // one bold line
  readingTimeSec: number;
}

export const INSIGHTS: Insight[] = [
  {
    id: 'specific-beats-creative',
    title: 'Why being specific beats being creative',
    body:
      'Most people try to be clever with prompts. They write "act as a world-class genius." It rarely helps.\n\nWhat does help: telling the AI exactly who the answer is for, what shape it should take, and what to leave out. "Write a 3-bullet summary for a busy CFO, no jargon" beats "write a great summary."\n\nSpecific beats clever every time. The AI is already creative. It needs a target.',
    takeaway: 'Aim, don\'t impress.',
    readingTimeSec: 45,
  },
  {
    id: 'three-second-test',
    title: 'The 3-second test for any prompt',
    body:
      'Read your prompt out loud. If a smart friend could not act on it in 3 seconds, the AI cannot either.\n\nAmbiguous goals produce ambiguous output. "Make it better" tells the model nothing. "Cut filler words and tighten the second paragraph" gives it a job.\n\nBefore you press send, ask: would a person know what to do with this? If not, fix it first.',
    takeaway: 'Clear to a human, clear to the AI.',
    readingTimeSec: 40,
  },
  {
    id: 'confidently-wrong',
    title: 'When AI is confidently wrong',
    body:
      'AI sounds sure of itself even when it is making things up. This is the most dangerous kind of mistake.\n\nA confident wrong answer feels right. You stop checking. The fix: treat any specific number, name, date, or quote as "needs verification" until you have seen the source.\n\nConfidence is a tone, not a truth signal.',
    takeaway: 'Confidence is not correctness.',
    readingTimeSec: 35,
  },
  {
    id: 'polite-prompt-myth',
    title: 'The polite-prompt myth',
    body:
      'Saying "please" and "thank you" does not make the AI try harder. It is not a person.\n\nWhat does change quality: clear instructions, examples, and a defined output format. Be direct. Skip the small talk.\n\nThis is not about being rude. It is about being efficient. Save your warmth for humans.',
    takeaway: 'Direct, not rude.',
    readingTimeSec: 30,
  },
  {
    id: 'first-answer-rarely-best',
    title: 'Why your first answer is rarely the best',
    body:
      'The first response from an AI is a draft. Treat it that way.\n\nFollow up with one of these: "Make it shorter." "Now make it sound less corporate." "What is the strongest counter-argument?"\n\nThe magic is in turn 2 and turn 3, not turn 1.',
    takeaway: 'Iterate, don\'t accept.',
    readingTimeSec: 30,
  },
  {
    id: 'ask-ai-to-disagree',
    title: 'Asking AI to disagree with itself',
    body:
      'Ask the AI for one answer. Then ask: "Now argue the opposite, as the smartest critic in the room."\n\nYou will learn more from the disagreement than the original answer. It surfaces what the AI quietly skipped.\n\nThis trick alone makes you sharper than 90% of users.',
    takeaway: 'Force the second opinion.',
    readingTimeSec: 35,
  },
  {
    id: 'eli5-trick',
    title: 'The "explain it like I\'m 5" trick',
    body:
      'When AI gives you a wall of jargon, ask: "Explain that to a 10-year-old, in 4 sentences."\n\nIf the AI cannot do that, the AI does not understand it well. And if you cannot read the simple version, you do not either.\n\nUse this on technical answers, legal answers, anything murky.',
    takeaway: 'Simple is the test of understanding.',
    readingTimeSec: 30,
  },
  {
    id: 'cant-do-your-thinking',
    title: 'Why AI can\'t do your thinking for you',
    body:
      'AI can draft, summarise, translate, and brainstorm at speed. It cannot decide what matters to you.\n\nThe judgment call — what to ship, what to cut, what is true for your situation — stays with you. AI hands you options. You still pick.\n\nUse it as a thinking partner, not a thinking replacement.',
    takeaway: 'You decide. AI drafts.',
    readingTimeSec: 35,
  },
  {
    id: 'follow-up-magic',
    title: 'The follow-up question is where the magic happens',
    body:
      'Beginners send one prompt and copy the answer. Experts send five.\n\nEach follow-up shapes the answer toward what you actually need. "Now for a UK audience." "Cut the marketing speak." "Add one example."\n\nA conversation outperforms a command, every time.',
    takeaway: 'One prompt is rarely enough.',
    readingTimeSec: 30,
  },
  {
    id: 'when-not-to-use-ai',
    title: 'When NOT to use AI',
    body:
      'Skip AI when: the answer must be 100% accurate (medical doses, legal filings), it involves your private feelings, or you need to think clearly without a co-pilot biasing you.\n\nUsing AI for everything is like using a chainsaw for everything. Some jobs need a butter knife.\n\nKnowing when to put it down is a skill.',
    takeaway: 'Sometimes silence beats a chatbot.',
    readingTimeSec: 35,
  },
];

export function getInsightOfTheDay(): Insight {
  // Day-of-year deterministic pick — same insight all day, rotates over time.
  const start = new Date(new Date().getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((Date.now() - start) / 86_400_000);
  return INSIGHTS[dayOfYear % INSIGHTS.length];
}
