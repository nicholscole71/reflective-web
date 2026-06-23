export type DailyPrompt = {
  title: string;
  category: string;
  description: string;
  reflection_question: string;
  experiment: string;
};

/**
 * 10 calibrated prompts provided by the user.
 * Deterministic date mapping cycles through categories daily.
 */
export const PROMPT_LIBRARY: DailyPrompt[] = [
  {
    title: "Story vs Reality",
    category: "Self Awareness",
    description:
      "A lot of stress comes from the story we add, not just what happened. Someone takes a while to reply, and your mind writes a full script about rejection or disrespect. Most of the time, that script is guesswork. Separating facts from interpretation gives you emotional breathing room and better next moves.",
    reflection_question:
      "What situation today upset me more because of the meaning I added to it?",
    experiment:
      'Pick one stressful moment and write two lines: "Facts" and "My story." Then rewrite the story in a more neutral way.',
  },
  {
    title: "Future Regret Test",
    category: "Decision Making",
    description:
      "When choices feel messy, zooming out helps. Imagine yourself one year from now looking back at today's decision. Which option would you regret not trying, even if it felt uncomfortable now? This does not remove uncertainty, but it helps you choose based on values instead of short-term fear.",
    reflection_question:
      "What decision am I delaying because I want certainty I am never going to get?",
    experiment:
      'For one choice today, write: "In one year, I will regret not ___ more than failing at ___." Then take one small step in that direction.',
  },
  {
    title: "Unspoken Expectations",
    category: "Relationships",
    description:
      'Many relationship frustrations come from expectations we never actually said out loud. We assume people should "just know" what matters to us, then feel hurt when they miss it. Clear requests are kinder than silent tests. Directness often creates more closeness, not less.',
    reflection_question:
      "Where am I feeling disappointed because I expected something I never clearly asked for?",
    experiment:
      "Make one direct, respectful request today instead of hinting or hoping someone notices.",
  },
  {
    title: "Advice Is Not Listening",
    category: "Communication",
    description:
      "People usually do not need instant solutions as much as they need to feel understood. Jumping to advice can make someone feel managed instead of heard. Slowing down and reflecting what you heard first builds trust fast. Better conversations start with understanding, not fixing.",
    reflection_question:
      "Who in my life might feel more supported if I listened longer before giving my opinion?",
    experiment:
      "In one conversation today, ask one follow-up question before offering any advice.",
  },
  {
    title: "Energy Audit",
    category: "Productivity",
    description:
      "You do not just manage time, you manage energy. Some tasks drain you for hours, while others create momentum quickly. If your most important work is always done when you are mentally tired, productivity will feel harder than it needs to. Matching work type to energy level is a daily advantage.",
    reflection_question:
      "When today was I mentally sharpest, and did I use that window on what matters most?",
    experiment:
      "Identify your next high-energy 30-minute window and reserve it for one meaningful task only.",
  },
  {
    title: "Name the Feeling, Choose the Response",
    category: "Emotional Intelligence",
    description:
      "When emotion is unnamed, it tends to drive behavior in the background. Naming it creates space between feeling and reaction. You can still be angry, anxious, or disappointed without letting it decide your next move. That pause is where emotional strength actually lives.",
    reflection_question:
      "What emotion has been quietly running my decisions today?",
    experiment:
      'When you feel triggered today, pause and say: "I am feeling ___." Then choose your next action on purpose.',
  },
  {
    title: "Enough for Today",
    category: "Happiness",
    description:
      "A lot of unhappiness comes from moving the finish line every day. You complete something, then immediately focus on what is still missing. Progress starts to feel invisible. Taking one minute to acknowledge enough for today builds satisfaction without lowering ambition.",
    reflection_question:
      "What did I do today that I dismissed too quickly because I was already chasing the next thing?",
    experiment:
      "Before bed, write down three things that were enough today, even if they were small.",
  },
  {
    title: "Confidence Through Proof",
    category: "Confidence",
    description:
      "Confidence grows more from evidence than from pep talks. Every time you keep a small promise to yourself, you build trust in your own word. Big confidence is usually built on many tiny follow-through moments. You do not need a breakthrough today, just one kept commitment.",
    reflection_question:
      "What small promise to myself have I been breaking that is lowering my self-trust?",
    experiment:
      "Set one 5-minute promise right now and complete it before doing anything else.",
  },
  {
    title: "Control What You Can Touch",
    category: "Philosophy",
    description:
      "We waste energy trying to control outcomes, people, and timing. What you can actually control is your preparation, your effort, and your response. That shift sounds simple, but it can instantly reduce anxiety and improve follow-through. Peace often starts with better target selection.",
    reflection_question:
      "What am I obsessing over that is outside my control, and what part of it can I actually influence?",
    experiment:
      'Write one worry in two columns: "Can control" and "Cannot control." Take one action from the first column today.',
  },
  {
    title: "Default Settings",
    category: "Psychology",
    description:
      "Under stress, people fall back to default patterns: avoid, people-please, over-explain, shut down, or get controlling. These defaults feel automatic because they are familiar, not because they are best. Noticing your default gives you a chance to choose a better pattern in real time.",
    reflection_question:
      "What is my stress default, and how did it show up this week?",
    experiment:
      "Pick one stress trigger today and pre-decide one alternative response you will use instead of your default.",
  },
];

function dayNumber(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utcMs = Date.UTC(y, (m ?? 1) - 1, d ?? 1);
  return Math.floor(utcMs / 86_400_000);
}

/**
 * Hardcoded by date and deterministic:
 * each new day moves to the next category/prompt.
 */
export function getDailyPrompt(dateStr: string): DailyPrompt {
  const idx = ((dayNumber(dateStr) % PROMPT_LIBRARY.length) + PROMPT_LIBRARY.length) % PROMPT_LIBRARY.length;
  return PROMPT_LIBRARY[idx];
}
