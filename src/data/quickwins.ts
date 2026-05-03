// 60-second prompt-quality upgrades. One paragraph each. Surfaced as
// rotating cards on the Learn tab.

export interface QuickWin {
  id: string;
  title: string;
  body: string;
}

export const QUICK_WINS: QuickWin[] = [
  {
    id: 'act-as',
    title: 'Start with "Act as a..."',
    body: 'Adding a role at the top of a prompt sharpens every sentence that follows. "Act as a senior editor" pulls the AI out of average mode and into a specific lens. One word, large effect.',
  },
  {
    id: 'think-step-by-step',
    title: 'Add "Think step by step"',
    body: 'For anything with logic — maths, planning, comparison — those four words measurably improve accuracy. The AI has to expose its reasoning, which catches its own mistakes.',
  },
  {
    id: 'what-questions',
    title: 'End with "What questions should I ask?"',
    body: 'Most users only ask the AI to answer. Few ask it to interview them. This single line surfaces the things you didn\'t know to wonder about.',
  },
  {
    id: 'audience-level',
    title: 'Tell AI the audience expertise level',
    body: '"Explain to a beginner" produces a different answer than "Explain to a CTO." Be explicit. The AI calibrates depth, jargon, and assumed background to whoever you name.',
  },
  {
    id: 'word-count',
    title: 'Specify word count, not "short"',
    body: '"Short" is fuzzy. "150 words" is a target. "3 sentences max" is a target. Targets get hit. Vibes get missed.',
  },
  {
    id: 'counter-argument',
    title: 'Ask "What\'s the strongest counter-argument?"',
    body: 'After any answer, run this follow-up. You\'ll get the case against — the case the AI quietly skipped because it was trying to be helpful. The combined view is what you actually wanted.',
  },
  {
    id: 'markdown-prompt',
    title: 'Use markdown in your prompt',
    body: 'Headings, bullets, and **bold** in your prompt help the AI parse what\'s instruction vs. context. It mirrors the structure back. Tidy in, tidy out.',
  },
  {
    id: 'two-examples',
    title: 'Provide 2 examples for new tasks',
    body: 'Telling the AI "write a snappy email" is one input. Showing two snappy emails you like is two more. The AI will average toward your examples — far closer to your taste than a description ever gets.',
  },
  {
    id: 'rate-itself',
    title: 'Ask AI to rate its answer 1–10',
    body: 'After it answers, add: "Now rate that answer 1–10. What\'s the weakest part? Rewrite that part only." It\'s self-critique, on tap. The rewrite is usually a real improvement.',
  },
  {
    id: 'critique-then-improve',
    title: 'Use "Critique this" before "Improve this"',
    body: 'Asking for an improved version straight away gets you a polished version of the same idea. Asking for a critique first surfaces the flaws — then the rewrite addresses them, not just the surface.',
  },
  {
    id: 'what-not-to-include',
    title: 'Tell AI what NOT to include',
    body: '"Don\'t use the words leverage, robust, or seamless." "No bullet points." "Don\'t apologise." Negative constraints work. The AI obeys them more reliably than vague positive ones.',
  },
  {
    id: 'opposite-case',
    title: 'Ask "What\'s the opposite case?"',
    body: 'A two-word follow-up that reliably produces a sharper second answer. The AI has to argue against itself, which exposes the weakest assumption in the original.',
  },
  {
    id: 'three-approaches',
    title: 'Ask for 3 different approaches',
    body: 'Instead of "How do I solve X?", try "Give me 3 different approaches to X, with the trade-off of each." You skip past the obvious answer and into real options.',
  },
  {
    id: 'beginner-assumptions',
    title: 'Use "I\'m a beginner — explain assumptions"',
    body: 'AI sometimes skips steps because it assumes you know them. This phrase makes it list the assumptions out loud. You catch the one that doesn\'t apply to you, fast.',
  },
  {
    id: 'why-this-answer',
    title: 'Ask "Why did you choose this answer?"',
    body: 'Forces the AI to expose the reasoning behind its choice. Half the time you\'ll find it picked option A only because A was alphabetically first in some training example. Knowing that, you can override.',
  },
];
