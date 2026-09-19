/**
 * The seven Common App personal statement prompts (unchanged for 2026-27) and
 * the 650-word limit that goes with them. Plain script, like schools.js, so
 * both the Alpine setup screen and the editor modules can read it.
 */
window.COMMON_APP_WORD_LIMIT = 650;

window.COMMON_APP_PROMPTS = [
  { n: 1, short: 'Background, identity, interest, or talent',
    text: "Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it. If this sounds like you, then please share your story." },
  { n: 2, short: 'Challenge, setback, or failure',
    text: "The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?" },
  { n: 3, short: 'Questioned or challenged a belief',
    text: "Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?" },
  { n: 4, short: 'Gratitude',
    text: "Reflect on something that someone has done for you that has made you happy or thankful in a surprising way. How has this gratitude affected or motivated you?" },
  { n: 5, short: 'Personal growth',
    text: "Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others." },
  { n: 6, short: 'Intellectual curiosity',
    text: "Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time. Why does it captivate you? What or who do you turn to when you want to learn more?" },
  { n: 7, short: 'Topic of your choice',
    text: "Share an essay on any topic of your choice. It can be one you've already written, one that responds to a different prompt, or one of your own design." },
];

window.getCommonAppPrompt = function (text) {
  if (!text) return null;
  return window.COMMON_APP_PROMPTS.find(p => p.text === text) || null;
};
