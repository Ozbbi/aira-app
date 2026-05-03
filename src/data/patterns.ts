// Reusable prompt patterns. Each entry: name + use-case + a copyable
// template + a fully worked example. These are the templates AIRA users
// can paste straight into ChatGPT/Claude/Gemini.

export interface PromptPattern {
  id: string;
  name: string;
  useCase: string;
  template: string;
  example: string;
}

export const PATTERNS: PromptPattern[] = [
  {
    id: 'expert-persona',
    name: 'Expert Persona',
    useCase: 'When you want a specific lens on a problem.',
    template:
      'Act as a {role} with {years} years of experience in {domain}.\n' +
      'I want you to {task}.\n' +
      'My situation: {context}.\n' +
      'Constraints: {constraints}.',
    example:
      'Act as a senior product manager with 10 years at consumer apps.\n' +
      'I want you to review my onboarding flow.\n' +
      'My situation: a habit-tracking app for adults 25–40, free tier with one upsell.\n' +
      'Constraints: keep advice to 5 bullets, focus on day-1 retention.',
  },
  {
    id: 'few-shot',
    name: 'Few-Shot Example',
    useCase: 'When tone or shape matters more than the topic.',
    template:
      'I want you to {task} in the same style as these examples.\n\n' +
      'Example 1:\n{example1}\n\nExample 2:\n{example2}\n\n' +
      'Now write one for: {newTopic}',
    example:
      'I want you to write a 1-line product tagline in the same style as these examples.\n\n' +
      'Example 1: Notion — One workspace. Every team.\n' +
      'Example 2: Linear — The issue tracker you\'ll enjoy using.\n\n' +
      'Now write one for: a habit-tracker called Loop.',
  },
  {
    id: 'chain-of-thought',
    name: 'Step-by-Step Reasoning',
    useCase: 'For maths, logic puzzles, or multi-stage decisions.',
    template:
      'Solve this step by step. Show your reasoning before the final answer.\n\n' +
      'Problem: {problem}\n\n' +
      'After you finish, rate your confidence 1–10.',
    example:
      'Solve this step by step. Show your reasoning before the final answer.\n\n' +
      'Problem: A subscription is $12/month. I have 240 users at 4% monthly churn. ' +
      'How many users will I have in 6 months if I add 30 new users a month?\n\n' +
      'After you finish, rate your confidence 1–10.',
  },
  {
    id: 'contrarian-review',
    name: 'Contrarian Review',
    useCase: 'Stress-test a plan before you commit.',
    template:
      'Here is my plan: {plan}\n\n' +
      'Now act as the smartest sceptic in the room. Give me the 3 strongest ' +
      'reasons this fails, and what I should do about each.',
    example:
      'Here is my plan: launch a paid newsletter for indie founders, $9/mo, ' +
      'one essay per week, growth via Twitter.\n\n' +
      'Now act as the smartest sceptic in the room. Give me the 3 strongest ' +
      'reasons this fails, and what I should do about each.',
  },
  {
    id: 'eli5',
    name: 'Explain Like I\'m 5',
    useCase: 'When jargon is winning. Force a plain-language version.',
    template:
      'Explain {topic} to a curious 10-year-old in 4 short sentences. ' +
      'No jargon. Use one analogy.',
    example:
      'Explain how a database index works to a curious 10-year-old in 4 short ' +
      'sentences. No jargon. Use one analogy.',
  },
  {
    id: 'compare-contrast',
    name: 'Compare & Contrast',
    useCase: 'Choosing between two options.',
    template:
      'Compare {optionA} and {optionB} for {goal}.\n' +
      'Use a table with: criterion, {optionA}, {optionB}, winner.\n' +
      'Then in 2 sentences, recommend one for my situation: {context}.',
    example:
      'Compare Postgres and MongoDB for a small SaaS app.\n' +
      'Use a table with: criterion, Postgres, MongoDB, winner.\n' +
      'Then in 2 sentences, recommend one for my situation: solo founder, ' +
      '<5k users expected in year 1, mostly relational data.',
  },
  {
    id: 'pros-cons',
    name: 'Pros and Cons',
    useCase: 'Quick decision support.',
    template:
      'Give me the strongest 3 pros and 3 cons of {decision}.\n' +
      'Then add one factor most people miss.',
    example:
      'Give me the strongest 3 pros and 3 cons of moving from a 9–5 to ' +
      'freelance copywriting.\n' +
      'Then add one factor most people miss.',
  },
  {
    id: 'refine-this',
    name: 'Refine This',
    useCase: 'Improving a draft you already wrote.',
    template:
      'Here is my draft:\n{draft}\n\n' +
      'Improve it for {audience}. Keep my voice. Cut filler. ' +
      'Show me the new version, then list the 3 biggest changes you made and why.',
    example:
      'Here is my draft:\n[paste your text]\n\n' +
      'Improve it for first-time founders. Keep my voice. Cut filler. ' +
      'Show me the new version, then list the 3 biggest changes you made and why.',
  },
  {
    id: 'whats-missing',
    name: 'What\'s Missing',
    useCase: 'Catching blind spots in your own work.',
    template:
      'Here is what I have: {work}\n\n' +
      'What is missing, weak, or assumed without proof? ' +
      'Be brutal but specific. End with the single biggest gap.',
    example:
      'Here is what I have: a draft of my pitch deck (10 slides).\n\n' +
      'What is missing, weak, or assumed without proof? Be brutal but ' +
      'specific. End with the single biggest gap.',
  },
  {
    id: 'roleplay-interview',
    name: 'Roleplay Interview',
    useCase: 'Practising a hard conversation before the real thing.',
    template:
      'Roleplay as {personType}. I am preparing for {situation}.\n' +
      'Ask me one question at a time, react to my answer like that person ' +
      'would, then ask the next. Stay in character.',
    example:
      'Roleplay as a sceptical Series A investor. I am preparing for a ' +
      'pitch in 2 days.\n' +
      'Ask me one question at a time, react to my answer like that person ' +
      'would, then ask the next. Stay in character.',
  },
];
