// Hand-written reference lessons that demonstrate the full lesson shape
// (intro / learnFirst / scenario / scenes / 5 questions / outro / takeaway).
// These are the templates the rest of the curriculum should match in tone
// and depth. Characters rotate (Maya, Deniz, Jordan, Lin, Sam) so no two
// adjacent lessons share a narrator.

export interface LessonScene {
  heading: string;
  vague: string;     // the weak version
  specific: string;  // the strong version
  note: string;      // what changed and why
}

export interface SeedQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'prompt_write' | 'ordering';
  question: string;
  options?: string[];
  correctAnswer: number | boolean | string | string[];
  explanation: string;
  airaFeedback: { correct: string; incorrect: string };
}

export interface SeedLesson {
  id: string;
  trackId: 'prompt' | 'critical' | 'power' | 'tools' | 'vibe' | 'create';
  title: string;
  character: string;
  airaIntro: string;
  learnFirst: string;
  realWorldScenario: string;
  scenes: LessonScene[];
  questions: SeedQuestion[];
  airaOutro: string;
  takeaway: string;
}

export const SEED_LESSONS: SeedLesson[] = [
  // ---------- PROMPT CRAFT ----------
  {
    id: 'prompt_specific',
    trackId: 'prompt',
    title: 'Why being specific beats being creative',
    character: 'Maya',
    airaIntro:
      'Most people think a "good" prompt is a clever one. It is not. A good prompt is a clear one. Today you will learn the move that separates beginners from sharp users.',
    learnFirst:
      'AI models are already creative. What they need from you is a target. Specific words give the model a target. Vague words give it a guess.',
    realWorldScenario:
      'Maya is a 10th grader writing an English essay about a book she loved. She types: "Write me a great essay about The Outsiders." It comes back boring and generic. She wonders what she did wrong.',
    scenes: [
      {
        heading: 'Audience',
        vague: 'Write an essay about The Outsiders.',
        specific: 'Write a 400-word essay about The Outsiders for a 10th-grade English teacher who values close reading.',
        note: 'Naming the reader changes the tone, depth, and vocabulary the AI picks.',
      },
      {
        heading: 'Angle',
        vague: 'Talk about the themes.',
        specific: 'Argue that loyalty matters more than class in The Outsiders. Use 2 quotes.',
        note: 'A sharp claim gives the essay a spine. "Talk about themes" gives it a shopping list.',
      },
      {
        heading: 'Constraints',
        vague: 'Make it good.',
        specific: 'No clichés like "ride or die." No filler words. Open with a question, not a definition.',
        note: 'Telling the AI what NOT to do is often more powerful than telling it what to do.',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'Which prompt is most likely to produce useful output?',
        options: [
          'Write me something great about climate change.',
          'Write a 200-word LinkedIn post about climate change for skeptical mid-career engineers, tone: matter-of-fact.',
          'Climate change. Make it interesting.',
          'Be creative and write about climate change.',
        ],
        correctAnswer: 1,
        explanation:
          'Option 2 names the audience, the format, the length, and the tone. The other three rely on the AI to guess.',
        airaFeedback: {
          correct: 'Yes. Audience + format + tone. That trio does most of the work.',
          incorrect: 'Look for the one that names WHO it\'s for, HOW long, and WHAT tone. The "great" and "creative" prompts ask the AI to guess.',
        },
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'Adding "be creative" usually improves an AI\'s answer.',
        correctAnswer: false,
        explanation:
          '"Be creative" is vague. The AI is already trying. What helps instead is a target — audience, length, angle, or what to avoid.',
        airaFeedback: {
          correct: 'Right. "Creative" is a vibe, not a target.',
          incorrect: 'Common myth. "Creative" tells the model nothing about what kind of creative.',
        },
      },
      {
        id: 'q3',
        type: 'fill_blank',
        question: 'Fill in the blank: A good prompt names the ____, the format, and what to avoid.',
        correctAnswer: 'audience',
        explanation: 'Naming the reader is the single highest-leverage thing you can add to a prompt.',
        airaFeedback: {
          correct: 'Yes. Always say who it\'s for.',
          incorrect: 'Hint: it\'s the reader. Once the AI knows who, tone and depth fall into place.',
        },
      },
      {
        id: 'q4',
        type: 'multiple_choice',
        question: 'Maya\'s essay came out generic. What\'s the FIRST fix?',
        options: [
          'Tell the AI to "try harder."',
          'Add the audience and a specific argument.',
          'Use a different AI model.',
          'Make the prompt longer with more please-and-thank-you.',
        ],
        correctAnswer: 1,
        explanation:
          'Audience + claim is the cheapest, biggest-impact fix. Switching models or adding politeness will not help.',
        airaFeedback: {
          correct: 'Exactly. Aim before you pull the trigger.',
          incorrect: 'Trying harder, switching models, or adding "please" all dodge the real issue: no target.',
        },
      },
      {
        id: 'q5',
        type: 'prompt_write',
        question: 'Rewrite this vague prompt into a specific one (2–3 sentences): "Write a poem about my dog."',
        correctAnswer:
          'Write an 8-line free-verse poem about my golden retriever for a friend who lost their own dog last year. Tone: tender, not cheesy. Avoid the words "best friend" and "loyal."',
        explanation:
          'Anything that names the reader, sets a length, picks a tone, and bans clichés is on the right track. There\'s no single right answer.',
        airaFeedback: {
          correct: 'Beautiful. You named the reader, the shape, and the trap to avoid. That\'s the move.',
          incorrect: 'Add at least one of: who reads it, how long, what tone, what NOT to say. Any of those will lift it.',
        },
      },
    ],
    airaOutro:
      'See how much changed by just naming the reader and the angle? Specific is not extra effort. It is the actual work of prompting.',
    takeaway: 'Aim, don\'t impress.',
  },

  // ---------- CRITICAL THINKING ----------
  {
    id: 'critical_three_question_test',
    trackId: 'critical',
    title: 'The 3-question test before trusting any AI answer',
    character: 'Lin',
    airaIntro:
      'AI answers sound confident even when they are wrong. Today you learn three quick questions that catch most mistakes before they cost you.',
    learnFirst:
      'Treat any AI answer like a confident stranger\'s tip. Useful, maybe. But you check before you act. The three questions: Is it specific? Is it sourced? Is it stable?',
    realWorldScenario:
      'Lin is a researcher writing a literature review. She asks the AI for "5 papers on memory consolidation." It returns five real-looking citations with authors and years. She is about to paste them into her bibliography.',
    scenes: [
      {
        heading: 'Question 1: Is it specific?',
        vague: 'AI: "Several studies have shown sleep improves memory."',
        specific: 'AI: "Walker (2008) found that an 8-hour sleep group recalled 40% more than a no-sleep group."',
        note: 'Specific claims you can check. Vague claims hide whether the AI knows anything at all.',
      },
      {
        heading: 'Question 2: Is it sourced?',
        vague: 'AI: "Studies show X."',
        specific: 'AI: "Walker et al., Nature, 2008, doi:10.1038/..."',
        note: 'A real source includes the journal and ideally a DOI. AI sometimes invents both. The fix: click the link.',
      },
      {
        heading: 'Question 3: Is it stable?',
        vague: 'Ask once, take the answer.',
        specific: 'Ask the same question in a fresh chat. If the answer changes a lot, the AI is guessing.',
        note: 'Stable answers across fresh sessions = the model probably "knows" it. Wobbly answers = guesses.',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'Lin sees a confident-looking citation. What should she do FIRST?',
        options: [
          'Paste it in. It looks real.',
          'Search the title and DOI to confirm the paper exists.',
          'Ask the AI "are you sure?"',
          'Switch to a different AI.',
        ],
        correctAnswer: 1,
        explanation:
          'Asking the AI "are you sure?" is theatre — it will say yes. Searching for the paper is the only real check.',
        airaFeedback: {
          correct: 'Yes. AI hallucinations beat AI self-checks. Always verify against the source.',
          incorrect: '"Are you sure?" gets you "Yes I\'m sure" even when it\'s wrong. The only real test is searching the source.',
        },
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'If an AI gives you a confident answer twice in a row, the answer is probably true.',
        correctAnswer: false,
        explanation:
          'Confidence and repetition are NOT truth signals. The AI can be wrong consistently if it learned a wrong pattern.',
        airaFeedback: {
          correct: 'Right. Confidence is a tone. Truth is a check.',
          incorrect: 'Confidence is a tone, not evidence. You still need to verify.',
        },
      },
      {
        id: 'q3',
        type: 'fill_blank',
        question: 'A useful trick: ask the AI the same question in a ____ chat to see if the answer is stable.',
        correctAnswer: 'fresh',
        explanation:
          'A fresh session removes the prior context. If the answer is consistent, the model probably has real signal. If it shifts a lot, it was guessing.',
        airaFeedback: {
          correct: 'Yes. A fresh chat is a free second opinion.',
          incorrect: 'Hint: it\'s about removing context. A blank slate. A new... ?',
        },
      },
      {
        id: 'q4',
        type: 'multiple_choice',
        question: 'Which of these is the LEAST trustworthy AI answer?',
        options: [
          '"In Walker (2008), participants recalled 40% more after sleep."',
          '"Many studies suggest sleep helps memory."',
          '"According to a 2008 paper in Nature by Walker, sleep boosts consolidation."',
          '"Sleep deprivation reduces memory consolidation; see e.g. Walker, 2008."',
        ],
        correctAnswer: 1,
        explanation:
          '"Many studies suggest" with no source, no number, no name. That is the AI\'s tell when it does not actually know.',
        airaFeedback: {
          correct: 'Yes. "Many studies suggest" is the verbal shrug. No specifics = no trust.',
          incorrect: 'The trustworthy answers name authors, years, or numbers. The vague one ("many studies") is the tell.',
        },
      },
      {
        id: 'q5',
        type: 'ordering',
        question: 'Order the 3-question test correctly:',
        options: ['Is it specific?', 'Is it sourced?', 'Is it stable?'],
        correctAnswer: ['Is it specific?', 'Is it sourced?', 'Is it stable?'],
        explanation:
          'Specific first (do they even claim something checkable?), sourced second (can I verify it?), stable last (does it survive a re-ask?).',
        airaFeedback: {
          correct: 'Specific → sourced → stable. That order saves time — you bail early on vague claims.',
          incorrect: 'Specific first because vague claims aren\'t worth verifying. Then sourced. Then stable as the final check.',
        },
      },
    ],
    airaOutro:
      'You are now sharper than 90% of AI users. Confident voice + no source = treat as guess. Always.',
    takeaway: 'Three questions, three layers of trust.',
  },

  // ---------- POWER USER MOVES ----------
  {
    id: 'power_chain_of_thought',
    trackId: 'power',
    title: 'Chain of thought: making AI think out loud',
    character: 'Jordan',
    airaIntro:
      'There is one phrase you can add to almost any prompt that improves the answer measurably. You will know it by the end of this lesson.',
    learnFirst:
      'Asking the AI to "think step by step" is not a magic spell. It is a real technique that forces the model to expose its reasoning. Exposed reasoning catches its own mistakes.',
    realWorldScenario:
      'Jordan is a PM at a startup. He asks AI: "Should we add Feature X next quarter?" The AI says yes, confidently. Jordan ships it. Two months later, retention drops. He wonders if there was a way to catch the bad call earlier.',
    scenes: [
      {
        heading: 'Without chain-of-thought',
        vague: 'Q: Should we add Feature X next quarter?\nA: Yes, it sounds valuable to users.',
        specific: 'A one-line answer with no reasoning. You cannot tell what the AI considered or skipped.',
        note: 'A short answer hides the assumptions. You cannot challenge what you cannot see.',
      },
      {
        heading: 'With chain-of-thought',
        vague: 'Q: Should we add Feature X next quarter? Think step by step.',
        specific:
          'A: Step 1, who asked for it? Step 2, what does it cost in eng weeks? Step 3, what does it kill (other roadmap items)? Step 4, retention impact estimate. Step 5, recommendation.',
        note: 'Now you can see exactly where the AI guessed and where it had data. You can argue with the weak step.',
      },
      {
        heading: 'When to use it',
        vague: 'Use it on every prompt.',
        specific: 'Use it on anything with logic — decisions, comparisons, maths, multi-stage planning. Skip it for short creative tasks.',
        note: 'Chain of thought adds tokens. Worth it for hard problems, overkill for "rewrite this tweet."',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'Which is the canonical phrase that triggers chain-of-thought?',
        options: ['"Be smart about this"', '"Think step by step"', '"Use your full intelligence"', '"Don\'t skip anything"'],
        correctAnswer: 1,
        explanation: '"Think step by step" is the well-studied phrase. The others are vibes-based and do not change behaviour reliably.',
        airaFeedback: {
          correct: 'Yes. Four words. Big lift on logic-heavy tasks.',
          incorrect: 'Only one of these is the documented trigger. Hint: it asks for incremental reasoning.',
        },
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'Chain-of-thought is worth using on every prompt, including "rewrite this tweet."',
        correctAnswer: false,
        explanation: 'For short creative tasks, exposed reasoning adds noise without value. Save it for logic-heavy work.',
        airaFeedback: {
          correct: 'Right. It\'s a tool, not a habit.',
          incorrect: 'For a tweet rewrite, you don\'t need 5 steps of reasoning. Save the technique for harder problems.',
        },
      },
      {
        id: 'q3',
        type: 'multiple_choice',
        question: 'What is the main benefit of chain-of-thought reasoning?',
        options: [
          'It makes the AI sound smarter.',
          'It exposes the AI\'s reasoning so you can argue with the weak step.',
          'It always produces a longer answer.',
          'It replaces the need for fact-checking.',
        ],
        correctAnswer: 1,
        explanation: 'Length and tone are side-effects. The real benefit is visibility — you can spot and challenge the bad assumption.',
        airaFeedback: {
          correct: 'Yes. Visibility is the point. Hidden reasoning = unchallengeable reasoning.',
          incorrect: 'Length and confidence are side-effects. The actual win is being able to see (and challenge) the weak step.',
        },
      },
      {
        id: 'q4',
        type: 'fill_blank',
        question: 'Jordan should add the phrase "_____ ____ ____ ____" to his roadmap-decision prompt.',
        correctAnswer: 'think step by step',
        explanation: 'Four words. Add them to any decision or logic prompt and the answer becomes inspectable.',
        airaFeedback: {
          correct: 'Memorised. Use it often.',
          incorrect: 'Hint: starts with "think" and ends with "step." Four words total.',
        },
      },
      {
        id: 'q5',
        type: 'prompt_write',
        question: 'Rewrite Jordan\'s prompt to use chain-of-thought:\n\nOriginal: "Should we add Feature X next quarter?"',
        correctAnswer:
          'Should we add Feature X next quarter? Think step by step. Walk me through: who asked, eng cost, what it displaces, retention impact, then a recommendation with confidence rating.',
        explanation:
          'Any rewrite that adds "think step by step" plus the steps you actually want named is a valid answer.',
        airaFeedback: {
          correct: 'Strong. You named the steps. Now the AI can\'t hide a weak assumption.',
          incorrect: 'Add "think step by step" plus what you want it to walk through. The more specific the steps, the better.',
        },
      },
    ],
    airaOutro:
      'You now have a four-word upgrade you can use on every important decision-prompt. Most users never learn it.',
    takeaway: 'Visible reasoning beats hidden confidence.',
  },

  // ---------- AI TOOLS MASTERY ----------
  {
    id: 'tools_picking_right_ai',
    trackId: 'tools',
    title: 'Picking the right AI for the job',
    character: 'Deniz',
    airaIntro:
      'There is no single best AI. There are different AIs for different jobs. Today you learn the one-question test for picking the right tool.',
    learnFirst:
      'The big three — ChatGPT, Claude, Gemini — each have a personality. ChatGPT is the generalist. Claude is the careful writer. Gemini is the search-anchored researcher. The right pick depends on the job.',
    realWorldScenario:
      'Deniz is a freelance copywriter. She uses one AI for everything. Sometimes the output feels off — too corporate for some clients, too playful for others. She wonders if she\'s using the wrong tool for half her work.',
    scenes: [
      {
        heading: 'The job: long-form writing',
        vague: 'Open the AI you always use.',
        specific: 'Use Claude. It is famously the strongest at sustained voice and nuanced rewriting.',
        note: 'For a 1,500-word essay where tone matters, Claude tends to win blind tests with writers.',
      },
      {
        heading: 'The job: I need today\'s news',
        vague: 'Ask ChatGPT.',
        specific: 'Use Perplexity or Gemini. Both have search built in. ChatGPT and Claude can be months out of date.',
        note: 'For "what happened this week," anchor in a search-first tool. Otherwise you risk hallucinated dates.',
      },
      {
        heading: 'The job: writing or debugging code',
        vague: 'Just ask any of them.',
        specific: 'Use Claude or Cursor (which uses Claude under the hood). Both consistently top code benchmarks.',
        note: 'Code is one of the few places benchmark differences are large enough to feel in daily use.',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'Deniz wants to write a long-form personal essay for a magazine. Which AI is the strongest pick today?',
        options: ['ChatGPT', 'Claude', 'Gemini', 'It does not matter, they\'re identical'],
        correctAnswer: 1,
        explanation: 'For sustained voice and nuanced rewriting, Claude is the most commonly cited pick among professional writers.',
        airaFeedback: {
          correct: 'Yes. Long-form + tone-sensitive = Claude\'s home turf right now.',
          incorrect: 'For long-form writing where voice matters, Claude is the consistent pick among writers. (This will change as models update.)',
        },
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'For a question about today\'s news, ChatGPT is the safest bet because it\'s the most popular.',
        correctAnswer: false,
        explanation: 'Popularity is not freshness. For up-to-the-day news, you want a search-anchored tool like Perplexity or Gemini.',
        airaFeedback: {
          correct: 'Right. Popular ≠ fresh. Anchor in search for time-sensitive questions.',
          incorrect: 'Popularity is not the same as having today\'s data. Use Perplexity or Gemini for fresh news.',
        },
      },
      {
        id: 'q3',
        type: 'multiple_choice',
        question: 'You need to debug a 50-line Python function. Best tool?',
        options: ['Gemini for the search', 'Claude or Cursor (Claude-powered)', 'A general chatbot, any of them', 'No AI — write it by hand'],
        correctAnswer: 1,
        explanation: 'Claude (and Cursor, which uses it under the hood) leads code-quality benchmarks for now. The gap is real day-to-day.',
        airaFeedback: {
          correct: 'Yes. Code benchmarks favour Claude / Cursor in 2025. Use the right tool.',
          incorrect: 'For code, the gap is real. Claude and Cursor consistently outperform on debugging tasks.',
        },
      },
      {
        id: 'q4',
        type: 'fill_blank',
        question: 'Fill in: For "what happened this week in tech," anchor in a ____-first tool like Perplexity.',
        correctAnswer: 'search',
        explanation: 'Search-anchored tools fetch fresh sources before answering, which avoids stale-data hallucinations.',
        airaFeedback: {
          correct: 'Yes. Search-first beats memory-first for fresh facts.',
          incorrect: 'Hint: what does Perplexity do that the others do not? It looks things up.',
        },
      },
      {
        id: 'q5',
        type: 'multiple_choice',
        question: 'What\'s the one-question test for picking an AI?',
        options: [
          'Which one is most popular?',
          'Which one is cheapest?',
          'What is this job\'s top need: voice, freshness, or code?',
          'Which logo do I like best?',
        ],
        correctAnswer: 2,
        explanation: 'Match the tool to the job\'s top need. Voice → Claude. Freshness → Perplexity / Gemini. Code → Claude / Cursor. Generalist → ChatGPT.',
        airaFeedback: {
          correct: 'Yes. Match the tool to the job\'s top need, not your habit.',
          incorrect: 'The trick is asking what the job needs most — then picking the AI that\'s strongest at that.',
        },
      },
    ],
    airaOutro:
      'From now on, before you open an AI, ask: voice, freshness, or code? Then pick. You will save time and ship better work.',
    takeaway: 'Right tool, right job.',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ROUND 2 — lessons inspired by Anthropic's AI Fluency curriculum.
  // Topics borrowed; words, characters, examples are AIRA-original.
  // ─────────────────────────────────────────────────────────────────────────

  // ---------- AI FLUENCY: THE 4 Ds ----------
  {
    id: 'fluency_four_ds',
    trackId: 'critical',
    title: 'The 4 Ds: a real framework for using AI',
    character: 'Sam',
    airaIntro:
      'Most "AI tips" lists are random. There is one framework worth memorising. It has four parts. After this lesson you will use it for every AI task.',
    learnFirst:
      'Whenever you reach for AI, run through four moves: Delegate (decide what to hand over), Describe (be specific about what you want), Discern (check what you got), Diligence (verify before you ship). Skip any of the four and your output drops a grade.',
    realWorldScenario:
      'Sam teaches high-school history. He asks AI to "write a worksheet on the French Revolution." It comes back generic, with one wrong date. He almost prints it. The 4 Ds would have caught every problem.',
    scenes: [
      {
        heading: 'Delegate',
        vague: 'Hand the whole task to AI: "Write the worksheet."',
        specific: 'Decide which parts only YOU should do (which questions matter for YOUR class) and let AI handle the boring scaffolding.',
        note: 'Smart users delegate the typing, not the thinking.',
      },
      {
        heading: 'Describe',
        vague: '"Write a worksheet on the French Revolution."',
        specific: '"Write 6 short-answer questions for a 10th-grade class. Focus on causes, not dates. Avoid the words bourgeoisie and proletariat — my students don\'t know them yet."',
        note: 'Tell the AI who, what shape, and what to avoid. Three knobs, huge difference.',
      },
      {
        heading: 'Discern',
        vague: 'Skim it, looks fine, print.',
        specific: 'Read each question. Spot anything the AI quietly oversimplified. Mark anything that needs a teacher\'s judgment.',
        note: 'Your taste is the reason you\'re here. Use it.',
      },
      {
        heading: 'Diligence',
        vague: 'Trust the dates, names, and quotes.',
        specific: 'Spot-check 1–2 facts. Wrong dates and invented quotes are AI\'s most common failure mode.',
        note: '30 seconds of fact-checking saves 30 minutes of student emails.',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'Which of these is NOT one of the 4 Ds?',
        options: ['Delegate', 'Describe', 'Decorate', 'Diligence'],
        correctAnswer: 2,
        explanation: 'Delegate, Describe, Discern, Diligence. "Decorate" is the trap — it sounds plausible but it\'s not in the framework.',
        airaFeedback: {
          correct: 'Memorised. Four Ds: Delegate, Describe, Discern, Diligence.',
          incorrect: 'The four are Delegate, Describe, Discern, Diligence. Decorate is not on the list.',
        },
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'Sam should delegate every part of the worksheet to the AI.',
        correctAnswer: false,
        explanation: 'Delegate the boring scaffolding. Keep the thinking — which questions matter, what depth fits your class — for yourself.',
        airaFeedback: {
          correct: 'Right. Delegate the typing, never the thinking.',
          incorrect: 'Delegating EVERYTHING is exactly the trap. Keep the parts only you can do.',
        },
      },
      {
        id: 'q3',
        type: 'multiple_choice',
        question: 'Sam noticed a wrong date in the worksheet. Which of the 4 Ds caught it?',
        options: ['Delegate', 'Describe', 'Discern', 'Diligence'],
        correctAnswer: 3,
        explanation: 'Diligence is the verification step — fact-checking 1–2 specifics catches AI\'s most common failure mode.',
        airaFeedback: {
          correct: 'Yes. Diligence is the safety net.',
          incorrect: 'Diligence = verify the facts. That\'s the step that catches wrong dates and invented quotes.',
        },
      },
      {
        id: 'q4',
        type: 'fill_blank',
        question: 'Fill in: ____ is the step where you tell the AI WHO it\'s for and WHAT shape the answer should take.',
        correctAnswer: 'describe',
        explanation: 'Describe = audience + format + tone + what to avoid. The single most undervalued step.',
        airaFeedback: {
          correct: 'Yes. Describe is where most users skimp — and most quality is lost.',
          incorrect: 'Hint: it starts with D and is about specifying the brief.',
        },
      },
      {
        id: 'q5',
        type: 'ordering',
        question: 'Order the 4 Ds in the right sequence:',
        options: ['Delegate', 'Describe', 'Discern', 'Diligence'],
        correctAnswer: ['Delegate', 'Describe', 'Discern', 'Diligence'],
        explanation: 'Delegate (decide what to hand over) → Describe (the brief) → Discern (read what came back) → Diligence (verify).',
        airaFeedback: {
          correct: 'Locked in. Run this loop every time.',
          incorrect: 'First decide what to hand over, then write the brief, then read the output, then verify. Delegate → Describe → Discern → Diligence.',
        },
      },
    ],
    airaOutro: 'You now have a framework most professionals do not. Use it on every real task and your output will jump a grade.',
    takeaway: 'Four Ds. Every task. Every time.',
  },

  // ---------- CAPABILITIES & LIMITATIONS ----------
  {
    id: 'capabilities_what_ai_cant',
    trackId: 'critical',
    title: 'What AI is bad at (and how to spot the signs)',
    character: 'Maya',
    airaIntro:
      'AI looks like magic. Until you ask it the wrong question and it confidently lies. Today: a 90-second tour of where AI breaks.',
    learnFirst:
      'AI is great at language and patterns. It is bad at exact maths, fresh facts, your private context, and your taste. Knowing the boundary saves hours.',
    realWorldScenario:
      'Maya asks AI: "What\'s the closest sushi place to me right now?" AI gives an address. The address does not exist. She drives there. She is angry. The mistake is not the AI — it is the question.',
    scenes: [
      {
        heading: 'Exact maths',
        vague: '"What\'s 17.4% of $2,341.99?"',
        specific: 'Use a calculator. Or tell the AI: "Use Python to compute this." Models slip on multi-step arithmetic.',
        note: 'AI guesses numbers. A calculator does not.',
      },
      {
        heading: 'Fresh facts',
        vague: '"What\'s the score of tonight\'s game?"',
        specific: 'Use a search-anchored tool (Perplexity, Gemini) or just open a sports site. Models ship months out of date.',
        note: 'If the answer changes daily, do not ask a model trained last year.',
      },
      {
        heading: 'Your private files',
        vague: '"Summarise the meeting we had on Tuesday."',
        specific: 'Paste the meeting notes. AI cannot access your calendar, email, or files unless you give them to it.',
        note: 'The AI lives in a sandbox. Bring the data to it.',
      },
      {
        heading: 'Your taste',
        vague: '"Pick the best logo for my brand."',
        specific: 'AI can show you 5 options + trade-offs. The choice is yours.',
        note: 'AI hands you options. You decide.',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'Which of these is AI MOST likely to get wrong?',
        options: [
          'Rewrite my paragraph in a friendlier tone.',
          'Compute 13.7% of $4,832.10 to the cent.',
          'Brainstorm 10 names for my newsletter.',
          'Explain photosynthesis simply.',
        ],
        correctAnswer: 1,
        explanation: 'Multi-step exact arithmetic is AI\'s weakest spot. Use a calculator, or ask the AI to use code.',
        airaFeedback: {
          correct: 'Yes. Language tasks: strong. Exact maths: weak. Pick the right tool.',
          incorrect: 'AI is fine at the language tasks. Multi-step exact arithmetic is the trap.',
        },
      },
      {
        id: 'q2',
        type: 'true_false',
        question: '"What happened in the news today?" is a great question for ChatGPT.',
        correctAnswer: false,
        explanation: 'Most chat AIs are trained months ago and do not know today\'s news. Use a search-anchored tool.',
        airaFeedback: {
          correct: 'Right. Fresh facts need fresh sources.',
          incorrect: 'Most chat models are months out of date. For "today," use Perplexity, Gemini, or a search engine.',
        },
      },
      {
        id: 'q3',
        type: 'fill_blank',
        question: 'Fill in: AI cannot read your private ____ unless you paste them in.',
        correctAnswer: 'files',
        explanation: 'AI lives in a sandbox. It does not see your calendar, email, photos, notes, or files unless you provide them.',
        airaFeedback: {
          correct: 'Yes. Bring the data to the AI, not the other way around.',
          incorrect: 'Hint: emails, calendars, notes — they\'re all this. AI cannot reach into your phone or laptop.',
        },
      },
      {
        id: 'q4',
        type: 'multiple_choice',
        question: 'Maya\'s sushi mistake — which limitation did she hit?',
        options: [
          'Exact maths',
          'Private files',
          'Fresh facts (real-time location data)',
          'Her own taste',
        ],
        correctAnswer: 2,
        explanation: 'Real-time, location-based facts. The model has no live map. It guessed an address that sounded right.',
        airaFeedback: {
          correct: 'Yes. "Closest place right now" needs live data the AI does not have.',
          incorrect: 'It\'s a fresh-facts limitation. AI has no live map and made up the address.',
        },
      },
      {
        id: 'q5',
        type: 'multiple_choice',
        question: 'Which task should you NOT delegate to AI alone?',
        options: [
          'Drafting an email response',
          'Choosing what to name your new business',
          'Brainstorming gift ideas',
          'Summarising a long article you pasted in',
        ],
        correctAnswer: 1,
        explanation: 'Naming is a taste decision. AI gives options; you pick. The other three are AI\'s strong suit.',
        airaFeedback: {
          correct: 'Yes. AI brainstorms; you decide.',
          incorrect: 'Naming is a taste decision — AI hands you a shortlist, but the call is yours.',
        },
      },
    ],
    airaOutro: 'Now you know the four corners of AI\'s box. Stay inside them and AI feels like magic. Step outside and it lies confidently.',
    takeaway: 'Know the box. Stay inside it.',
  },

  // ---------- ITERATION ----------
  {
    id: 'power_iteration',
    trackId: 'power',
    title: 'Iteration: why turn 2 is where it gets good',
    character: 'Deniz',
    airaIntro:
      'Beginners send one prompt and copy the answer. Experts send five. The gap between them is one habit you will learn now.',
    learnFirst:
      'Treat every AI answer as a draft. The real work is the follow-up: tighten, sharpen, push against. Three smart follow-ups beat ten new prompts.',
    realWorldScenario:
      'Deniz writes a tagline for a client. AI gives "Where ideas come alive." It\'s fine. Generic. She used to ship it. Now she runs it through three follow-ups and gets something the client actually loves.',
    scenes: [
      {
        heading: 'The tighten',
        vague: 'Ship the first answer.',
        specific: '"Cut it to 5 words. Make it less abstract — name a specific outcome."',
        note: 'A constraint forces the AI to drop the corporate filler.',
      },
      {
        heading: 'The sharpen',
        vague: 'Accept the polished version.',
        specific: '"Now write 3 versions in different tones: bold, dry-witty, and quietly confident."',
        note: 'You learn what direction works by seeing them side by side.',
      },
      {
        heading: 'The push-back',
        vague: 'Move on to the next task.',
        specific: '"What\'s wrong with the version you picked? What\'s the strongest case AGAINST it?"',
        note: 'The case-against often surfaces the weak word you missed.',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'AI gives Deniz "Where ideas come alive." What is the BEST follow-up?',
        options: [
          '"Make it better."',
          '"Cut to 5 words. Replace the abstract verb with a specific outcome."',
          '"Try again."',
          '"That\'s perfect, thanks."',
        ],
        correctAnswer: 1,
        explanation: '"Make it better" gives the AI nothing. The specific cut + replace gives it a target.',
        airaFeedback: {
          correct: 'Yes. Specific follow-up = sharper output. Always.',
          incorrect: 'Vague follow-ups produce vague new drafts. The specific one with a length cap and a swap is the move.',
        },
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'It\'s smarter to send 10 fresh prompts than to follow up 3 times on one.',
        correctAnswer: false,
        explanation: 'Follow-ups carry context. New prompts start cold. Three good follow-ups beat ten cold restarts.',
        airaFeedback: {
          correct: 'Right. Follow-ups carry context. Fresh prompts re-invent the wheel.',
          incorrect: 'A follow-up keeps the conversation\'s memory. Re-prompting from scratch loses everything you both already worked out.',
        },
      },
      {
        id: 'q3',
        type: 'multiple_choice',
        question: 'What does the "push-back" follow-up do?',
        options: [
          'Asks the AI to start over.',
          'Forces the AI to argue against its own answer.',
          'Gets the AI to apologise.',
          'Makes the AI shorter.',
        ],
        correctAnswer: 1,
        explanation: 'Asking for the case AGAINST surfaces weak assumptions the AI was glossing over.',
        airaFeedback: {
          correct: 'Yes. Push-back surfaces the weak word.',
          incorrect: 'Push-back = "argue against your own answer." It\'s the underrated step.',
        },
      },
      {
        id: 'q4',
        type: 'fill_blank',
        question: 'Fill in: Treat every AI answer as a ____.',
        correctAnswer: 'draft',
        explanation: 'Drafts get edited. First answers get accepted. The mindset matters.',
        airaFeedback: {
          correct: 'Yes. Mindset shift: it\'s always a draft.',
          incorrect: 'Hint: it\'s the opposite of "final." Something you edit.',
        },
      },
      {
        id: 'q5',
        type: 'prompt_write',
        question: 'AI gave you a paragraph that\'s "fine but generic." Write 3 follow-ups (one each: tighten, sharpen, push-back).',
        correctAnswer:
          '1) Cut to 80 words. Drop any abstract verbs. 2) Now give me 3 versions: bold, dry-witty, quietly confident. 3) What\'s the strongest case against the version you\'d pick?',
        explanation: 'Anything covering the three moves — a constraint cut, a tonal split, a self-critique — is a strong answer.',
        airaFeedback: {
          correct: 'Beautiful. You ran the loop. That\'s the muscle.',
          incorrect: 'Aim for: one with a hard constraint (tighten), one asking for variants (sharpen), one asking it to argue against itself (push-back).',
        },
      },
    ],
    airaOutro: 'You now have the loop most users never learn. Use it once today on something real.',
    takeaway: 'Send three. Not one.',
  },

  // ---------- SYSTEM PROMPTS ----------
  {
    id: 'power_system_prompts',
    trackId: 'power',
    title: 'Setting the rules: system prompts vs user prompts',
    character: 'Lin',
    airaIntro:
      'Most users only know one kind of prompt. There are two. Knowing the difference between them is what separates "user" from "operator."',
    learnFirst:
      'A user prompt is what you type. A system prompt is the standing order — the rules the AI follows for the whole conversation. Set good rules once and every reply gets better automatically.',
    realWorldScenario:
      'Lin is a researcher. Every day she asks AI to summarise papers. Every day she repeats: "Be brief. Use bullet points. No speculation." She doesn\'t know about system prompts. She is doing five times the work.',
    scenes: [
      {
        heading: 'Without a system prompt',
        vague: 'Every chat: "Be brief. Bullets. No speculation. ... Now summarise this paper."',
        specific: 'You repeat the rules every time. The AI sometimes forgets them mid-conversation.',
        note: 'Repetition + drift. Two flavours of pain.',
      },
      {
        heading: 'With a system prompt',
        vague: '— (no standing rules)',
        specific: 'Set once: "You are my research assistant. Always reply in 5-bullet summaries. Never speculate. Always cite the source line."',
        note: 'Now every chat starts from the right baseline. You only type the new question.',
      },
      {
        heading: 'Where you set it',
        vague: 'Just send a regular message.',
        specific: 'In ChatGPT: "Custom Instructions" or a Project. In Claude: "Custom style" or a Project. Same idea, different name.',
        note: 'Look for the words "system," "instructions," "style," or "project." That\'s the right place.',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'Which is the BEST description of a system prompt?',
        options: [
          'A prompt the AI sends back to you.',
          'Standing rules the AI follows for the whole conversation.',
          'A way to crash the AI.',
          'A prompt only paid users get.',
        ],
        correctAnswer: 1,
        explanation: 'System prompts are the standing orders. User prompts are individual questions.',
        airaFeedback: {
          correct: 'Yes. Standing orders. Set once, applied always.',
          incorrect: 'A system prompt is the standing rule layer — "always do X, never do Y" — applied to the whole conversation.',
        },
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'You should put "be brief and use bullets" in your system prompt instead of repeating it every chat.',
        correctAnswer: true,
        explanation: 'That\'s exactly what system prompts are for — habits you want every time.',
        airaFeedback: {
          correct: 'Right. Set the habit at the system level. Stop repeating yourself.',
          incorrect: 'Anything you find yourself repeating is a system-prompt candidate. Move it up.',
        },
      },
      {
        id: 'q3',
        type: 'multiple_choice',
        question: 'Lin sets a system prompt: "Always cite the source line." She forgets to repeat it. The AI stops citing. Why?',
        options: [
          'System prompts wear off after 5 minutes.',
          'They\'re probably NOT in the system layer — they\'re in a user message that fell out of context.',
          'AI is broken.',
          'She needs to pay.',
        ],
        correctAnswer: 1,
        explanation: 'If a rule "wears off," it was almost certainly in a user message that scrolled out of context, not in the system layer where it persists.',
        airaFeedback: {
          correct: 'Yes. If a rule fades, it\'s in the wrong layer.',
          incorrect: 'System prompts don\'t wear off. If a rule did, it was actually in a user message — move it up to the system layer.',
        },
      },
      {
        id: 'q4',
        type: 'fill_blank',
        question: 'In Claude, system-style rules live in a "Project" or in your "Custom ____."',
        correctAnswer: 'style',
        explanation: 'Claude calls it "Custom style" (or you can attach instructions to a Project). ChatGPT calls the same thing "Custom Instructions."',
        airaFeedback: {
          correct: 'Yes. Custom style in Claude. Custom Instructions in ChatGPT.',
          incorrect: 'Hint: it\'s a 5-letter word, and Claude\'s setting menu uses it. "Custom ___."',
        },
      },
      {
        id: 'q5',
        type: 'prompt_write',
        question: 'Write a system prompt for "AI as my email-writing assistant." 3-5 rules.',
        correctAnswer:
          'You are my email-writing assistant. Always reply with the email draft only — no preamble. Keep tone friendly but direct. Maximum 120 words. Never use the words "leverage," "synergy," or "circle back." If unclear, ask one clarifying question instead of guessing.',
        explanation: 'Any answer with role + 2-4 standing rules + a graceful failure mode is on track.',
        airaFeedback: {
          correct: 'Strong. Role, rules, failure mode. That\'s a real system prompt.',
          incorrect: 'Aim for: a role ("you are X"), 2-3 standing rules, and one failure mode ("if unclear, do Y"). That trio is the recipe.',
        },
      },
    ],
    airaOutro: 'You just stepped from "user" to "operator." Set one good system prompt today on the AI you use most.',
    takeaway: 'Rules at the top. Questions at the bottom.',
  },

  // ---------- TOOL USE ----------
  {
    id: 'power_tool_use',
    trackId: 'power',
    title: 'When AI calls something else: tool use, simply',
    character: 'Jordan',
    airaIntro:
      'You\'ve heard the phrase "tool use" or "function calling." Sounds technical. It\'s actually the most useful thing AI does in 2026. Here\'s the plain-English version.',
    learnFirst:
      'Tool use means the AI doesn\'t answer from memory — it calls something (a calculator, a search, your calendar, a database) and answers from the live result. It\'s how AI stops hallucinating numbers and dates.',
    realWorldScenario:
      'Jordan asks AI: "How long until our launch on March 14?" AI without tools guesses (and often gets it wrong). AI WITH tools opens a calendar function, computes the diff, returns the exact day count. Same model, very different reliability.',
    scenes: [
      {
        heading: 'Without tools',
        vague: 'AI: "Around 47 days, I think."',
        specific: 'AI relies on its training and counts in its head. Often off by a few days.',
        note: 'Memory is fuzzy. Date math is brittle.',
      },
      {
        heading: 'With tools',
        vague: '(same prompt)',
        specific: 'AI: "Calling date_diff(today, 2026-03-14)... 49 days exactly."',
        note: 'No guess. A real function ran. The number is right.',
      },
      {
        heading: 'When to ask for it',
        vague: 'Use it for everything.',
        specific: 'Anything specific — exact maths, current data, real searches, your files. Skip it for creative writing.',
        note: 'Tools = trust + speed for facts. Tools ≠ better creativity.',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'What does "tool use" mean in plain English?',
        options: [
          'The AI uses a hammer.',
          'The AI calls a function (calculator, search, calendar) instead of guessing.',
          'A premium feature only enterprises get.',
          'When you tell the AI it did a good job.',
        ],
        correctAnswer: 1,
        explanation: 'The AI delegates the precise part to a tool — calculator, search, code execution — and reads the real result.',
        airaFeedback: {
          correct: 'Yes. AI calls a function for the part it can\'t fake.',
          incorrect: 'Tool use = AI calling a real function (calculator, search, code) and using the real result, not its memory.',
        },
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'Tool use makes AI better at creative writing.',
        correctAnswer: false,
        explanation: 'Tools help with facts: maths, dates, searches, files. Creative writing is about language, not facts to look up.',
        airaFeedback: {
          correct: 'Right. Tools = facts. Creativity = language.',
          incorrect: 'Tools help where AI is brittle — exact facts. They don\'t change how good the prose is.',
        },
      },
      {
        id: 'q3',
        type: 'multiple_choice',
        question: 'Which task BENEFITS most from tool use?',
        options: [
          'Writing a poem about autumn.',
          'Brainstorming brand names.',
          'Calculating compound interest on $4,200 over 7 years at 5.2%.',
          'Summarising a paragraph in plain English.',
        ],
        correctAnswer: 2,
        explanation: 'Compound interest is exact maths. A calculator-tool computes it correctly; a model alone often slips.',
        airaFeedback: {
          correct: 'Yes. Exact maths is the textbook tool-use case.',
          incorrect: 'Compound interest is precise arithmetic. AI guesses; a calculator-tool gets it right.',
        },
      },
      {
        id: 'q4',
        type: 'fill_blank',
        question: 'Fill in: Tool use turns "I think" into "I _____."',
        correctAnswer: 'looked',
        explanation: 'The AI stops guessing and starts looking up real values. "Looked it up" / "looked at the calendar" / "checked."',
        airaFeedback: {
          correct: 'Yes. From "I think" to "I looked."',
          incorrect: 'Hint: it\'s past-tense, 6 letters. Replaces guessing with checking.',
        },
      },
      {
        id: 'q5',
        type: 'multiple_choice',
        question: 'Jordan wants exact day counts to launch. What should he do?',
        options: [
          'Trust the AI\'s estimate.',
          'Open a tool-enabled chat (like ChatGPT or Claude with code) and let it call a date function.',
          'Send 5 follow-ups to verify.',
          'Use a different AI brand.',
        ],
        correctAnswer: 1,
        explanation: 'Tool-enabled chats can run a real date diff. That\'s reliable; estimates and follow-ups won\'t fix the underlying guess.',
        airaFeedback: {
          correct: 'Yes. Reach for the tool-enabled chat for anything precise.',
          incorrect: 'Estimates won\'t become exact through follow-ups. Reach for the tool-enabled chat that can actually compute.',
        },
      },
    ],
    airaOutro: 'You now know the magic word that turns "AI guesses" into "AI checks." Use it for anything that needs precision.',
    takeaway: 'Facts? Use a tool. Words? Use the model.',
  },

  // ---------- CONFIDENCE READING ----------
  {
    id: 'critical_reading_confidence',
    trackId: 'critical',
    title: 'Reading AI\'s confidence (and when to distrust it)',
    character: 'Sam',
    airaIntro:
      'AI sounds equally certain whether it knows the answer or just made it up. Today: how to read between the lines.',
    learnFirst:
      'Vague hedging language ("generally," "typically," "many studies") = the model is unsure. Sharp specifics = the model thinks it knows. Specifics can still be wrong, but vagueness is almost always a tell.',
    realWorldScenario:
      'Sam asks AI: "Does my favourite book, [obscure title], have a sequel?" AI confidently invents a sequel that doesn\'t exist. Sam catches it because the AI gave too-perfect detail without hedging.',
    scenes: [
      {
        heading: 'The hedge tells',
        vague: '"Generally, this is the case." "Many experts agree."',
        specific: 'Read these as: "I am unsure. I am averaging the internet."',
        note: 'Generic hedges = generic confidence = treat as a starting point only.',
      },
      {
        heading: 'The over-confident hallucination',
        vague: 'AI invents a fake citation: "(Smith, 2018, Journal of X, p.42)"',
        specific: 'When AI gives weirdly specific details about something obscure with NO hedge, that\'s often the hallucination tell.',
        note: 'Real expertise hedges. Fakes do not.',
      },
      {
        heading: 'The "say it twice" check',
        vague: 'Trust on the first reply.',
        specific: 'Open a fresh chat. Re-ask. If the answer changes meaningfully, the model was guessing.',
        note: 'Real knowledge is stable. Guesses drift.',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'true_false',
        question: 'A confident-sounding AI answer is more likely to be true than a hedged one.',
        correctAnswer: false,
        explanation: 'Confidence in tone has almost no relationship with truth. Sometimes the most confident answers are the made-up ones.',
        airaFeedback: {
          correct: 'Right. Tone is not truth.',
          incorrect: 'Confidence doesn\'t correlate with correctness. Sometimes the boldest answers are the invented ones.',
        },
      },
      {
        id: 'q2',
        type: 'multiple_choice',
        question: 'Which is the BIGGEST hallucination warning?',
        options: [
          'AI hedges with "I think" or "approximately."',
          'AI gives a perfectly specific obscure detail with no hedge at all.',
          'AI cites a Wikipedia link.',
          'AI says "let me think."',
        ],
        correctAnswer: 1,
        explanation: 'Real expertise hedges on edge cases. When AI is over-specific about something obscure with zero hedge, it\'s often inventing.',
        airaFeedback: {
          correct: 'Yes. Over-specific + zero hedge = check it.',
          incorrect: 'The tell is the OPPOSITE of hedging: a too-perfect, too-specific claim about something niche, with no uncertainty marker.',
        },
      },
      {
        id: 'q3',
        type: 'fill_blank',
        question: 'Open a ____ chat and re-ask. If the answer drifts, the AI was guessing.',
        correctAnswer: 'fresh',
        explanation: 'A fresh session removes context. Stable answers across fresh chats are more trustworthy than answers that wobble.',
        airaFeedback: {
          correct: 'Yes. A fresh chat is a free second opinion.',
          incorrect: 'Hint: it\'s about a clean slate. A new... ?',
        },
      },
      {
        id: 'q4',
        type: 'multiple_choice',
        question: 'Sam suspects an answer is invented. What should he do FIRST?',
        options: [
          'Ask the AI "are you sure?"',
          'Search the specific claim on the web.',
          'Trust it.',
          'Ask a different AI the same question.',
        ],
        correctAnswer: 1,
        explanation: 'Asking the AI "are you sure?" gets a yes whether it\'s right or not. Searching the actual claim is the only real check.',
        airaFeedback: {
          correct: 'Yes. Search the claim. AI self-checks are theatre.',
          incorrect: 'AI will say "yes" to "are you sure?" regardless. Search the actual claim — that\'s the real test.',
        },
      },
      {
        id: 'q5',
        type: 'multiple_choice',
        question: 'Which phrase signals genuine uncertainty (not a hallucination)?',
        options: [
          '"In my analysis..."',
          '"Recent research has firmly established that..."',
          '"I\'m not sure about the specific date — you should verify this."',
          '"As is well known..."',
        ],
        correctAnswer: 2,
        explanation: 'Honest hedging that names the uncertainty AND tells you to verify is a good sign. "Well known" and "firmly established" are often filler.',
        airaFeedback: {
          correct: 'Yes. Honest hedge + verify-this = trustworthy.',
          incorrect: 'The honest one names what it\'s unsure about and tells you to verify. The other phrases sound expert but signal nothing.',
        },
      },
    ],
    airaOutro: 'You now read AI like a poker game. Tone is bluff. Specifics are the hand. Always check the cards.',
    takeaway: 'Hedge ≠ wrong. Confidence ≠ right.',
  },

  // ---------- TOOLS: CLAUDE 101 ----------
  {
    id: 'tools_claude_essentials',
    trackId: 'tools',
    title: 'Claude essentials: what makes it different',
    character: 'Maya',
    airaIntro:
      'Claude is one of the big three AIs. It has a personality. Knowing it well means you can pick the right tool faster.',
    learnFirst:
      'Claude\'s strengths: long, careful writing; following nuanced instructions; admitting when it\'s unsure. It has Projects (persistent memory for a topic), Artifacts (it builds documents and code in a side panel), and a notably honest tone.',
    realWorldScenario:
      'Maya is writing a 1,500-word college essay. She tries ChatGPT and Claude with the same prompt. Claude\'s draft sounds less corporate. It\'s also the one that admits when a paragraph isn\'t working.',
    scenes: [
      {
        heading: 'Long-form writing',
        vague: 'Pick whatever AI is open.',
        specific: 'For sustained voice and tone, Claude tends to win blind tests with writers right now.',
        note: 'Voice is where the gap is biggest. Test it on something you\'ve written.',
      },
      {
        heading: 'Projects',
        vague: 'Start a fresh chat for everything.',
        specific: 'Use a Project for any ongoing topic — your essay, your business, your studies. Upload reference files; Claude remembers them every chat in that project.',
        note: 'Stop re-pasting. Start a project once, save hours.',
      },
      {
        heading: 'Artifacts',
        vague: 'Read AI\'s answer in the chat thread.',
        specific: 'Long answers (a draft, a piece of code, a table) appear in a side panel you can edit and download.',
        note: 'It\'s like having a Google Doc inside the chat. Underrated.',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'Maya needs to write a 1,500-word personal essay where voice matters. Best pick today?',
        options: ['ChatGPT', 'Claude', 'Gemini', 'It really doesn\'t matter'],
        correctAnswer: 1,
        explanation: 'For long-form work where voice and nuance matter, Claude is the consistent pick among writers. (This may shift as models update.)',
        airaFeedback: {
          correct: 'Yes. Long-form, voice-sensitive = Claude\'s strength.',
          incorrect: 'For the voice-and-nuance combination, Claude leads in current writer tests.',
        },
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'Claude\'s "Projects" feature is mostly a way to save chat history.',
        correctAnswer: false,
        explanation: 'Projects let you upload files Claude remembers across every chat in that project. Far more than chat history — it\'s persistent context.',
        airaFeedback: {
          correct: 'Right. Projects = persistent context, not just history.',
          incorrect: 'Projects are bigger than that — they hold reference files Claude pulls from every chat in that project.',
        },
      },
      {
        id: 'q3',
        type: 'multiple_choice',
        question: 'What\'s an Artifact in Claude?',
        options: [
          'An ancient prompt.',
          'A side-panel document or code that Claude builds and you can edit.',
          'A premium feature.',
          'A model error log.',
        ],
        correctAnswer: 1,
        explanation: 'Artifacts are the side panel where long content lives — drafts, tables, code. You can iterate on them without losing the chat.',
        airaFeedback: {
          correct: 'Yes. Artifacts = side-panel document you can edit.',
          incorrect: 'Artifacts are the side panel for long content — drafts, code, tables — that you can edit live.',
        },
      },
      {
        id: 'q4',
        type: 'fill_blank',
        question: 'Fill in: For an ongoing topic, start a ____ once and stop re-pasting context.',
        correctAnswer: 'project',
        explanation: 'A Project holds your reference files and standing instructions, so every chat starts from the right baseline.',
        airaFeedback: {
          correct: 'Yes. Project once, write forever.',
          incorrect: 'Hint: it\'s the persistent-context feature. Starts with P. 7 letters.',
        },
      },
      {
        id: 'q5',
        type: 'multiple_choice',
        question: 'Which is NOT one of Claude\'s known strengths?',
        options: [
          'Long, careful writing',
          'Following nuanced instructions',
          'Real-time news from today',
          'Admitting when it\'s unsure',
        ],
        correctAnswer: 2,
        explanation: 'For real-time news, use Perplexity or Gemini. Claude is trained months ago and is not search-anchored by default.',
        airaFeedback: {
          correct: 'Yes. For today\'s news, switch tools.',
          incorrect: 'Real-time news is the limit. Use Perplexity or Gemini for anything from today.',
        },
      },
    ],
    airaOutro: 'You now know which lane Claude wins. Pick it for the work that fits.',
    takeaway: 'Long-form, voice, careful — that\'s Claude.',
  },

  // ---------- CREATING WITH AI ----------
  {
    id: 'create_voice_clone',
    trackId: 'critical',
    title: 'Making AI write LIKE you (without sounding like AI)',
    character: 'Deniz',
    airaIntro:
      'AI has a default voice. It is corporate-friendly, slightly bland, terrified of being wrong. Today you learn to override it with YOUR voice.',
    learnFirst:
      'AI mirrors examples better than it follows descriptions. Showing 2-3 samples of your writing, with one note about what to keep and what to drop, beats any "be playful" prompt.',
    realWorldScenario:
      'Deniz wants AI to draft her newsletter. She tries: "Write in my style." Output is generic. She tries again: pastes 3 of her past intros + "match this voice. Keep the contractions and the rhetorical questions. Cut the corporate-friendly polish." Now it sounds like her.',
    scenes: [
      {
        heading: 'Describe your style',
        vague: '"Write in my voice — playful and direct."',
        specific: 'AI doesn\'t know what "playful" means to you. Output: generic.',
        note: 'Adjectives are too soft. AI guesses your style based on a stereotype of those adjectives.',
      },
      {
        heading: 'Show your style (few-shot)',
        vague: '— (no examples)',
        specific: 'Paste 3 short samples you wrote. End with: "Match this voice. Keep [X]. Drop [Y]."',
        note: 'Examples > adjectives. Always.',
      },
      {
        heading: 'Iterate the difference',
        vague: 'Accept the first match.',
        specific: 'Ask: "Where does the new draft NOT sound like the samples? Rewrite just those sentences."',
        note: 'You\'re training a tiny model in real time. The closer you point at the difference, the closer it gets.',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'Which is the strongest way to make AI write in your voice?',
        options: [
          '"Write playfully and directly, like me."',
          'Paste 2-3 samples of your real writing + one note about what to keep and drop.',
          'Use lots of emojis in the prompt.',
          'Write "BE LIKE ME" in caps.',
        ],
        correctAnswer: 1,
        explanation: 'Examples beat descriptions every time. AI mirrors what it sees, not what it\'s told.',
        airaFeedback: {
          correct: 'Yes. Show, don\'t tell. Always.',
          incorrect: 'Describing a voice with adjectives never works. Showing 2-3 samples reliably does.',
        },
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'Adjectives like "playful" and "direct" are enough for AI to nail your voice.',
        correctAnswer: false,
        explanation: 'Adjectives let AI guess from a stereotype. Two real samples ground it in actual evidence.',
        airaFeedback: {
          correct: 'Right. Adjectives = guesses. Examples = ground truth.',
          incorrect: 'Adjectives don\'t carry enough information. AI needs samples to mirror.',
        },
      },
      {
        id: 'q3',
        type: 'fill_blank',
        question: 'Showing AI examples of your work is called "____-shot" prompting.',
        correctAnswer: 'few',
        explanation: 'Few-shot = giving the model a small number of examples (typically 2-5). It\'s the most reliable way to shift output style.',
        airaFeedback: {
          correct: 'Yes. Few-shot. Memorise it.',
          incorrect: 'Hint: it\'s a 3-letter word for "a small number of." Few-___?',
        },
      },
      {
        id: 'q4',
        type: 'multiple_choice',
        question: 'Deniz\'s draft mostly matches her voice but one paragraph still sounds AI-flavoured. Best move?',
        options: [
          'Throw it out and start over.',
          '"Where does this NOT match the samples? Rewrite just those sentences."',
          'Tell the AI to "be more like me."',
          'Use a different model.',
        ],
        correctAnswer: 1,
        explanation: 'Pointing at the specific difference is the highest-leverage follow-up. Starting over loses the parts that already worked.',
        airaFeedback: {
          correct: 'Yes. Surgical edits beat starting over.',
          incorrect: 'Don\'t throw out the parts that worked. Point at the specific paragraph and ask for a targeted rewrite.',
        },
      },
      {
        id: 'q5',
        type: 'prompt_write',
        question: 'You\'re writing an Instagram caption. Sketch the structure of a few-shot prompt that makes AI sound like you.',
        correctAnswer:
          'Here are 3 captions I wrote: [caption 1] [caption 2] [caption 3]. Notice: contractions, short sentences, one rhetorical question. Match this voice. Keep the rhetorical question move. Drop any "as we all know" or filler. Now write a caption for: [topic].',
        explanation: 'Anything with: 2-3 examples + a "keep this / drop that" note + the new task is on track.',
        airaFeedback: {
          correct: 'Strong. Examples + keep/drop note + the new task. That\'s the recipe.',
          incorrect: 'Aim for: 2-3 of YOUR examples, one "keep [X]" note, one "drop [Y]" note, then the new task.',
        },
      },
    ],
    airaOutro: 'You now have the voice-cloning move. Save 3 of your best paragraphs as a snippet. Reuse them every time.',
    takeaway: 'Show. Don\'t describe.',
  },

  // ---------- VERIFICATION WORKFLOW ----------
  {
    id: 'critical_verify_workflow',
    trackId: 'critical',
    title: 'Verify in 60 seconds: a workflow you\'ll use forever',
    character: 'Lin',
    airaIntro:
      'Most "verify" advice is vague. Today you get a 60-second routine you can run on any AI claim. Real, simple, repeatable.',
    learnFirst:
      'Three steps: extract the specific claim, search for it, compare. If the AI\'s claim is real, you find it within 30 seconds. If you don\'t find it, treat it as unverified and rewrite.',
    realWorldScenario:
      'Lin wants to use this AI quote in her presentation: "According to a 2023 MIT study, 73% of remote workers report higher productivity." It sounds great. It would be embarrassing if she presented it and the study didn\'t exist.',
    scenes: [
      {
        heading: 'Step 1 — Extract',
        vague: 'Trust the whole sentence.',
        specific: 'Pull out the SPECIFIC checkable parts: "MIT study, 2023, 73%, remote workers, productivity."',
        note: 'You\'re looking for nouns and numbers. Not the framing words.',
      },
      {
        heading: 'Step 2 — Search',
        vague: 'Google "is this AI claim true?"',
        specific: 'Search the specific phrase: "MIT 2023 remote workers 73% productivity." Look for the original source.',
        note: 'Search the claim, not the question. The claim has the keywords.',
      },
      {
        heading: 'Step 3 — Compare',
        vague: 'If something looks similar, accept.',
        specific: 'Find the actual source. Does the number match? Is the year right? Is "MIT" actually MIT? If anything is off, the AI either rounded creatively or invented it.',
        note: 'Close-enough is not the same as right.',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'Which is the BEST search for verifying Lin\'s quote?',
        options: [
          '"is this AI quote real"',
          '"MIT 2023 remote workers 73% productivity"',
          '"productivity studies"',
          '"how to verify AI"',
        ],
        correctAnswer: 1,
        explanation: 'Search the specific keywords from the claim itself. The first option searches the question; the second searches the claim.',
        airaFeedback: {
          correct: 'Yes. Search the claim, not the question.',
          incorrect: 'You want the actual nouns and numbers from the AI\'s claim — "MIT 2023 remote workers 73% productivity" — not a generic question.',
        },
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'If you can\'t find the source within 30 seconds, the safe move is to treat the claim as unverified and rewrite.',
        correctAnswer: true,
        explanation: 'Real claims are usually findable fast. If you can\'t locate it, that\'s often because the AI invented it.',
        airaFeedback: {
          correct: 'Right. No source in 30 seconds = treat as unverified.',
          incorrect: 'Real claims are usually findable in seconds. If you can\'t — write it as "studies suggest" or rephrase, don\'t cite the made-up specifics.',
        },
      },
      {
        id: 'q3',
        type: 'fill_blank',
        question: 'Step 1 of the verify workflow: ____ the specific checkable parts of the claim.',
        correctAnswer: 'extract',
        explanation: 'Extract = pull out the nouns + numbers. Skip the framing words. Search those specifics.',
        airaFeedback: {
          correct: 'Yes. Extract first, then search.',
          incorrect: 'Hint: 7 letters, means "pull out the specific bits." Starts with E.',
        },
      },
      {
        id: 'q4',
        type: 'multiple_choice',
        question: 'You search the claim and find a similar study with DIFFERENT numbers. What now?',
        options: [
          'Use the AI\'s number, it\'s close enough.',
          'Use the real source\'s number and cite the real source.',
          'Don\'t mention either.',
          'Ask the AI again to be sure.',
        ],
        correctAnswer: 1,
        explanation: 'Always use the real number from the real source. Even if the AI was "close," close-enough is wrong-enough to lose credibility.',
        airaFeedback: {
          correct: 'Yes. Real source, real number, every time.',
          incorrect: 'Close-enough is the credibility killer. Always use the real number from the real source.',
        },
      },
      {
        id: 'q5',
        type: 'ordering',
        question: 'Order the 60-second verify workflow:',
        options: ['Extract', 'Search', 'Compare'],
        correctAnswer: ['Extract', 'Search', 'Compare'],
        explanation: 'Extract the keywords, Search for them, Compare the AI\'s claim against the real source.',
        airaFeedback: {
          correct: 'Locked. Use this on every important AI claim.',
          incorrect: 'Extract → Search → Compare. Pull out the specifics, look them up, check they match.',
        },
      },
    ],
    airaOutro: 'You now have a routine sharper than 90% of AI users. 60 seconds. Three steps. No more cringe-worthy citations.',
    takeaway: 'Extract, search, compare. Every time.',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ROUND 3 — closing the curriculum gaps. Each one targets a question
  // we kept seeing in user testing: "what about [X]?".
  // ─────────────────────────────────────────────────────────────────────────

  // ---------- FOUNDATIONS — entry lesson ----------
  {
    id: 'foundations_1',
    trackId: 'prompt',
    title: 'Welcome to AIRA — your first lesson',
    character: 'Maya',
    airaIntro:
      "Hey. This is your first AIRA lesson. It's short. By the end you'll know the single move that improves every prompt you write.",
    learnFirst:
      'A prompt is a request to an AI. Better prompts = better answers. The simplest move that always helps: name the audience. "Explain to a 10-year-old" produces a different answer than "explain to a doctor."',
    realWorldScenario:
      'Maya is making her first AI request. She types: "Explain quantum physics." She gets back something dense and academic. She is confused. She tries again with one small change.',
    scenes: [
      {
        heading: 'Without an audience',
        vague: '"Explain quantum physics."',
        specific: 'AI defaults to "average internet expert" — dense, jargon-heavy, easy for the AI but useless for Maya.',
        note: 'No audience = AI guesses your level.',
      },
      {
        heading: 'With an audience',
        vague: '"Explain quantum physics to a curious 10th grader."',
        specific: 'AI now knows: skip the maths, use analogies, keep paragraphs short. The same model gives a wildly different answer.',
        note: 'One change. Huge improvement.',
      },
      {
        heading: 'Calibrating up',
        vague: '"Explain quantum physics to me."',
        specific: '"Explain to a software engineer who knows linear algebra but not physics."',
        note: 'You can dial the level up or down. AI matches.',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'Which prompt is most likely to give Maya a useful answer?',
        options: [
          '"Explain quantum physics."',
          '"Explain quantum physics to a curious 10th grader."',
          '"Quantum physics. Now."',
          '"Tell me everything."',
        ],
        correctAnswer: 1,
        explanation: 'Naming the audience (10th grader) tells the AI what level to pitch the answer at.',
        airaFeedback: {
          correct: 'Yes! Naming the audience is the cheapest, biggest win in prompting.',
          incorrect: 'Look for the one that names WHO the answer is for. That single word changes everything.',
        },
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'A "prompt" just means: a question or request to an AI.',
        correctAnswer: true,
        explanation: 'That\'s it. Anything you type to the AI is a prompt. Better prompts produce better answers.',
        airaFeedback: {
          correct: 'Right. Prompt = your message to the AI.',
          incorrect: 'A prompt is just what you say to the AI. Nothing fancy. Better prompts = better answers.',
        },
      },
      {
        id: 'q3',
        type: 'fill_blank',
        question: 'The single biggest move that improves any prompt: name the ____.',
        correctAnswer: 'audience',
        explanation: 'Audience first. Once the AI knows who it\'s for, tone and depth fall into place automatically.',
        airaFeedback: {
          correct: 'Yes. Audience is everything.',
          incorrect: 'Hint: it\'s WHO the answer is for. The reader.',
        },
      },
      {
        id: 'q4',
        type: 'multiple_choice',
        question: 'You want AI to write a recipe explanation. Best version?',
        options: [
          '"Explain how to make pasta."',
          '"Explain how to make pasta to a 12-year-old learning to cook."',
          '"Recipe."',
          '"Make it good."',
        ],
        correctAnswer: 1,
        explanation: 'Same trick. Naming the reader (12-year-old learning) shapes the difficulty and tone.',
        airaFeedback: {
          correct: 'Pattern locked. Audience = the cheat code.',
          incorrect: 'The pattern is the same as quantum physics — name the reader, get a usable answer.',
        },
      },
      {
        id: 'q5',
        type: 'prompt_write',
        question: 'Pick something you want to learn today. Write a one-line prompt that names the audience.',
        correctAnswer:
          'Explain compound interest to a college freshman who hates maths but understands money.',
        explanation:
          'Anything that names a specific reader (with one or two traits) is on track. Your answer is YOUR answer.',
        airaFeedback: {
          correct: 'You just used the move. Write it down somewhere — you will use it every day.',
          incorrect: 'Just one detail about the reader is enough. Beginner / expert / age / context — pick any.',
        },
      },
    ],
    airaOutro:
      "That's your first lesson. One move. Use it on every prompt you write today and tell me how it goes.",
    takeaway: 'Always name the reader.',
  },

  // ---------- CRITICAL — the second prompt rule ----------
  {
    id: 'critical_1',
    trackId: 'critical',
    title: 'AI sounds confident. Don\'t fall for it.',
    character: 'Jordan',
    airaIntro:
      "Today's lesson is the one most users skip — and the one that saves you from looking foolish. AI sounds equally sure when it's right and when it's wrong. Here's how to tell the difference.",
    learnFirst:
      'Confidence in AI is a TONE, not a truth signal. The way it sounds — calm, authoritative, complete — has almost nothing to do with whether the answer is correct. Your job is to verify, not to feel.',
    realWorldScenario:
      'Jordan asks AI to recommend a restaurant in his city. AI gives a name, an address, and a glowing description. Jordan drives there. The restaurant does not exist. The address is a parking lot.',
    scenes: [
      {
        heading: 'The tell — too perfect, no hedge',
        vague: '"Try The Golden Lantern at 412 Elm Street."',
        specific: 'No hedge. No "I think." No "double-check this." That confidence around an obscure local fact is the signal to verify.',
        note: 'Real expertise hedges. Confident specifics about niche things = often invented.',
      },
      {
        heading: 'The 30-second check',
        vague: 'Trust the recommendation.',
        specific: 'Search the name. Check the address on a map. 30 seconds. Saves the drive.',
        note: 'Verification is not paranoia. It\'s craft.',
      },
      {
        heading: 'The right ask',
        vague: '"Recommend a restaurant in [city]."',
        specific: '"Recommend 3 restaurants in [city] WITH links to their websites so I can verify they exist."',
        note: 'Asking for verifiable sources is a 5-word fix that prevents most hallucinations.',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'true_false',
        question: 'A confident-sounding AI answer is usually correct.',
        correctAnswer: false,
        explanation: 'Confidence in tone is unrelated to correctness. The most confident-sounding answers can be the most invented.',
        airaFeedback: {
          correct: 'Right. Tone is not truth.',
          incorrect: 'Confidence is a vibe. Truth is a check. They\'re different.',
        },
      },
      {
        id: 'q2',
        type: 'multiple_choice',
        question: 'Jordan got a fake restaurant recommendation. What\'s the BEST way to prevent this?',
        options: [
          'Trust AI more next time.',
          'Ask for restaurants WITH website links so he can verify.',
          'Ask "are you sure?"',
          'Use a different AI brand.',
        ],
        correctAnswer: 1,
        explanation: 'Asking for verifiable sources up front is the cheapest fix. Asking "are you sure?" gets you "yes" regardless of truth.',
        airaFeedback: {
          correct: 'Yes. Build verification INTO the prompt.',
          incorrect: 'AI will say "yes I\'m sure" whether it\'s right or not. The fix is asking for sources you can click.',
        },
      },
      {
        id: 'q3',
        type: 'fill_blank',
        question: 'Real expertise hedges. AI confidence around obscure specifics is often a sign the answer is ____.',
        correctAnswer: 'invented',
        explanation: '"Invented" / "made up" / "hallucinated" — when AI gets too specific about something niche without hedging, it\'s often filling in gaps with plausible-sounding fiction.',
        airaFeedback: {
          correct: 'Yes. Too perfect = often fake.',
          incorrect: 'Hint: when AI fills in details it doesn\'t actually know, it\'s "I-something." Made up.',
        },
      },
      {
        id: 'q4',
        type: 'multiple_choice',
        question: 'Which AI answer is MOST trustworthy?',
        options: [
          '"The capital of France is Paris."',
          '"Dr. Smith\'s 2019 paper found that 73% of users prefer X. (No source link.)"',
          '"I\'m not certain — but I think the answer is around 2.5%. Worth verifying with a calculator."',
          '"Trust me, this is correct."',
        ],
        correctAnswer: 2,
        explanation: 'Honest hedging + asking you to verify is the trustworthy signal. Specific stats with no source are often invented. "Trust me" is a tell.',
        airaFeedback: {
          correct: 'Yes. Honest hedge = honest AI.',
          incorrect: 'The trustworthy answer is the one that admits uncertainty AND tells you to verify.',
        },
      },
      {
        id: 'q5',
        type: 'multiple_choice',
        question: 'You ask AI for a quote from a famous book. AI gives a confident, perfectly polished quote. What now?',
        options: [
          'Use it. It sounds great.',
          'Search the quote in quotes online to confirm it\'s real.',
          'Ask the AI "did you make this up?"',
          'Use it but credit "internet sources."',
        ],
        correctAnswer: 1,
        explanation: 'A 10-second quote search confirms or kills the quote. AI invents fake but perfect-sounding quotes routinely.',
        airaFeedback: {
          correct: 'Yes. 10 seconds. Real or fake. Always check.',
          incorrect: 'AI invents fake quotes that sound like the author. Quote search is the only reliable check.',
        },
      },
    ],
    airaOutro:
      "Now you read AI like a poker player reads a table. Tone is bluff. Specifics are the hand. Always check the cards.",
    takeaway: 'Confidence is a tone, not a truth.',
  },

  // ---------- POWER — entry lesson for the track ----------
  {
    id: 'power_1',
    trackId: 'power',
    title: 'The follow-up is the most underrated move',
    character: 'Lin',
    airaIntro:
      "Beginners send one prompt and copy the answer. Experts send five. The difference between them isn't talent. It's one habit you'll learn now.",
    learnFirst:
      'Treat every AI answer as a draft. The real value comes from your follow-up. Three good follow-ups beat ten new prompts every time.',
    realWorldScenario:
      'Lin is a researcher. She asks AI to summarise a 30-page paper. The summary is fine. Generic. She used to copy it into her notes. Now she runs three follow-ups — and gets something an expert would write.',
    scenes: [
      {
        heading: 'The "what did you skip" follow-up',
        vague: 'Accept the summary.',
        specific: '"What important detail did you skip in that summary?"',
        note: 'Forces the AI to surface what it quietly compressed away.',
      },
      {
        heading: 'The "argue the other side" follow-up',
        vague: 'Trust the framing.',
        specific: '"Now write the strongest case AGAINST what you just said."',
        note: 'Surfaces the weakness in any conclusion. Free second opinion.',
      },
      {
        heading: 'The "in 3 sentences" follow-up',
        vague: 'Read the wall of text.',
        specific: '"Now compress that into 3 sentences a non-expert could remember."',
        note: 'A length cap forces the AI to drop fluff and keep substance.',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'You get a fine-but-generic answer. BEST follow-up?',
        options: [
          '"Make it better."',
          '"What important detail did you skip?"',
          '"Try harder."',
          '"That\'s perfect, thanks."',
        ],
        correctAnswer: 1,
        explanation: '"Make it better" gives the AI nothing. "What did you skip?" forces it to surface the substance it compressed away.',
        airaFeedback: {
          correct: 'Yes. Specific follow-up surfaces specific value.',
          incorrect: '"Make it better" is the lazy follow-up. The specific one ("what did you skip?") gets specific results.',
        },
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'Sending 10 fresh prompts is smarter than 3 good follow-ups on one.',
        correctAnswer: false,
        explanation: 'Follow-ups carry conversation context. Fresh prompts start cold. 3 follow-ups outperform 10 cold restarts almost always.',
        airaFeedback: {
          correct: 'Right. Follow-ups compound. Fresh prompts reset.',
          incorrect: 'Each fresh prompt loses the context you both already built. Follow-ups carry it forward.',
        },
      },
      {
        id: 'q3',
        type: 'multiple_choice',
        question: 'Lin wants to compress a long answer. Best follow-up?',
        options: [
          '"Shorter."',
          '"Now compress that into 3 sentences a non-expert could remember."',
          '"Be brief."',
          '"Less words."',
        ],
        correctAnswer: 1,
        explanation: 'A specific length cap + audience hint forces real compression. "Shorter" is too vague.',
        airaFeedback: {
          correct: 'Yes. Number + audience = specific compression.',
          incorrect: '"Shorter" is fuzzy. "3 sentences for a non-expert" is a target. Targets get hit.',
        },
      },
      {
        id: 'q4',
        type: 'fill_blank',
        question: 'Three good follow-ups beat ten new ____.',
        correctAnswer: 'prompts',
        explanation: 'Follow-ups carry context. New prompts start cold. The math favours follow-ups.',
        airaFeedback: {
          correct: 'Yes. Iterate, don\'t restart.',
          incorrect: 'Hint: it\'s the thing you start fresh each time. Starts with P.',
        },
      },
      {
        id: 'q5',
        type: 'prompt_write',
        question: 'Write a 3-step follow-up sequence for "AI gave me a fine-but-bland email draft."',
        correctAnswer:
          '1) What\'s the weakest sentence in this email? 2) Rewrite that sentence with one specific detail only I could know. 3) Now compress the whole thing to under 80 words.',
        explanation:
          'Anything covering: identify weak spot → fix specifically → compress, is on track. The structure beats the words.',
        airaFeedback: {
          correct: 'Strong. You ran the loop. Use it for real today.',
          incorrect: 'Aim for: one diagnostic ("what\'s weak?"), one targeted fix, one compression. The pattern beats the exact words.',
        },
      },
    ],
    airaOutro:
      "You now have the loop most users never learn. Use it once today on something real. Watch the difference.",
    takeaway: 'Send three. Not one.',
  },

  // ---------- TOOLS — entry lesson ----------
  {
    id: 'tools_1',
    trackId: 'tools',
    title: 'AI tools 101: which one for which job',
    character: 'Sam',
    airaIntro:
      "There's no single best AI. There are different AIs for different jobs. Here's the one-question test that gets you to the right one in 10 seconds.",
    learnFirst:
      'The big three for general use: ChatGPT (the generalist), Claude (the careful writer + coder), Gemini (the search-anchored researcher). Match the tool to the job\'s top need: voice, freshness, or code.',
    realWorldScenario:
      'Sam is a teacher. He uses one AI for everything — lesson plans, fact-checking, news clippings, creative writing. The output feels off half the time. He doesn\'t know he\'s using the wrong tool for half his work.',
    scenes: [
      {
        heading: 'Job: long-form writing',
        vague: 'Open whatever you usually open.',
        specific: 'Use Claude. Strongest at sustained voice and tone in 2026 blind tests.',
        note: 'For an essay where voice matters, Claude consistently wins.',
      },
      {
        heading: 'Job: today\'s news',
        vague: 'Ask any chat AI.',
        specific: 'Use Perplexity or Gemini — both have search built in. Most chat AIs are months out of date.',
        note: 'Fresh facts need fresh sources.',
      },
      {
        heading: 'Job: code',
        vague: 'Ask whichever opens fastest.',
        specific: 'Use Claude or Cursor (which uses Claude). Both consistently top code benchmarks.',
        note: 'Code is one place benchmark differences are felt daily.',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'Sam wants to write a heartfelt 1,000-word piece for the school newsletter. Best pick?',
        options: ['ChatGPT', 'Claude', 'Gemini', 'Doesn\'t matter'],
        correctAnswer: 1,
        explanation: 'For long-form writing where voice matters, Claude consistently wins among writers right now.',
        airaFeedback: {
          correct: 'Yes. Long-form + voice = Claude\'s lane.',
          incorrect: 'For sustained voice in long writing, Claude leads in 2026. (May shift as models update.)',
        },
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'For "what happened in tech this week," ChatGPT is the best pick because it\'s the most popular.',
        correctAnswer: false,
        explanation: 'Popularity is not freshness. For real-time news, anchor in a search-first tool like Perplexity or Gemini.',
        airaFeedback: {
          correct: 'Right. Popular ≠ fresh.',
          incorrect: 'Most chat AIs are months out of date. For "today," use a search-anchored tool.',
        },
      },
      {
        id: 'q3',
        type: 'multiple_choice',
        question: 'You need to debug 80 lines of Python. Best pick?',
        options: ['Gemini, for the search', 'Claude or Cursor', 'A general chatbot, any one', 'No AI'],
        correctAnswer: 1,
        explanation: 'Claude (and Cursor, which uses Claude) leads code benchmarks in 2026. The gap is real day-to-day.',
        airaFeedback: {
          correct: 'Yes. Code = Claude / Cursor.',
          incorrect: 'For code, the gap matters. Claude and Cursor consistently outperform.',
        },
      },
      {
        id: 'q4',
        type: 'fill_blank',
        question: 'Match the tool to the job\'s top need: voice, freshness, or ____.',
        correctAnswer: 'code',
        explanation: 'The three big needs that map cleanly to tools. Voice → Claude. Freshness → Perplexity/Gemini. Code → Claude/Cursor.',
        airaFeedback: {
          correct: 'Yes. Three needs, three lanes.',
          incorrect: 'Hint: the third is the technical one — programming. 4 letters.',
        },
      },
      {
        id: 'q5',
        type: 'multiple_choice',
        question: 'What\'s the one-question test for picking an AI?',
        options: [
          'Which one is most popular?',
          'Which one is cheapest?',
          'What is the job\'s top need: voice, freshness, or code?',
          'Which logo do I like best?',
        ],
        correctAnswer: 2,
        explanation: 'Match the tool to the job\'s top need. Habit and price come second. Brand loyalty comes last.',
        airaFeedback: {
          correct: 'Yes. Match the tool to the job, not your habit.',
          incorrect: 'The trick is asking what the job needs most — then picking the AI strongest at that need.',
        },
      },
    ],
    airaOutro:
      "From now on: voice, freshness, or code? Pick. Save time. Ship better work.",
    takeaway: 'Right tool, right job.',
  },
];
