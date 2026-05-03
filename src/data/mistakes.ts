// The most common AI-usage mistakes, with the cost and the fix.
// Surfaced on the Learn tab and inside lessons as cautionary asides.

export interface AiMistake {
  id: string;
  title: string;
  whyPeopleDoIt: string;
  whatItCosts: string;
  theFix: string;
}

export const MISTAKES: AiMistake[] = [
  {
    id: 'trusting-first-answer',
    title: 'Trusting the first answer',
    whyPeopleDoIt: 'It sounds confident and arrives instantly. Feels finished.',
    whatItCosts: 'You ship the AI\'s draft instead of your best work. Quality flatlines at "average AI."',
    theFix: 'Always do one round of follow-up: ask for a stronger version, the opposite case, or what is missing.',
  },
  {
    id: 'no-citation-check',
    title: 'Not checking citations',
    whyPeopleDoIt: 'Footnotes look authoritative. We assume the AI looked them up.',
    whatItCosts: 'AI sometimes invents sources that do not exist. You quote a book that was never written.',
    theFix: 'Click every link. If a source has no link, paste the claim into a search engine before using it.',
  },
  {
    id: 'over-context',
    title: 'Over-explaining the context',
    whyPeopleDoIt: 'You think more background = better answer. So you paste 4 paragraphs of setup.',
    whatItCosts: 'The AI loses the point. Long prompts often produce vaguer answers than short ones.',
    theFix: 'Lead with the question in one sentence. Add only the context that changes the answer.',
  },
  {
    id: 'vague-words',
    title: 'Using vague words like "good"',
    whyPeopleDoIt: '"Make it good" feels obvious to you. The AI has no idea what good means here.',
    whatItCosts: 'You get something generic. You blame the AI. You try again with the same prompt.',
    theFix: 'Replace "good" with concrete criteria: "shorter," "more punchy," "for a sceptical reader."',
  },
  {
    id: 'no-format',
    title: 'Not specifying a format',
    whyPeopleDoIt: 'You assume the AI will pick the right shape. Sometimes it does. Often it does not.',
    whatItCosts: 'You get a wall of prose when you needed bullets. You re-prompt to reshape.',
    theFix: 'End your prompt with the shape: "Reply as a 5-bullet list." Or "Reply as a 2-column table."',
  },
  {
    id: 'no-role',
    title: 'Forgetting to give the AI a role',
    whyPeopleDoIt: '"Just answer the question" feels efficient.',
    whatItCosts: 'You get a beige, average-the-internet answer with no point of view.',
    theFix: 'Open with one role: "Act as a senior editor." "Act as a sceptical investor." Watch the answer sharpen.',
  },
  {
    id: 'asking-impossible',
    title: 'Asking AI to do things it can\'t',
    whyPeopleDoIt: 'It feels like magic, so we forget the limits: real-time data, your private files, perfect maths.',
    whatItCosts: 'You build a workflow on top of a fact the AI guessed. Things break later.',
    theFix: 'When in doubt, ask: "Can you actually verify this, or are you guessing?" The honest models will tell you.',
  },
  {
    id: 'copy-paste-no-edit',
    title: 'Shipping AI output without editing',
    whyPeopleDoIt: 'It already sounds polished. Editing feels like extra work.',
    whatItCosts: 'Your work starts to sound like everyone else\'s work. Your voice disappears.',
    theFix: 'Treat AI output as a draft. Cut 20%. Add one specific detail only you would know. Now it\'s yours.',
  },
];
