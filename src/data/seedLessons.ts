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
];
