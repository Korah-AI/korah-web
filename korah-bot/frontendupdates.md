Korah Web – Feature Roadmap

1. Chat history & session management





Persistent single-session history: Store the current chatWidget() conversation in localStorage so that reloading the page restores the last study chat in the #chat section of index.html.



Multi-conversation list: Add a left-hand or top "Sessions" list in the chat card so students can create, rename, and switch between conversations (e.g., "Bio exam", "Calc HW 5"). Each session maps to a separate message array in storage.



Context length controls: Let users toggle whether a new message continues the same session context or starts fresh (helpful when they want a brand-new answer without old context).



Export & clear: Provide actions to export a chat as markdown/text and to clear history for privacy, matching your “no account / local-first” story.

2. Quick tool UIs wired to AI





One-click study actions: Under the chat input, add compact buttons like "Make flashcards from this", "Turn this into a study guide", "Quiz me on this" that:





Use the last user or AI message as input



Call dedicated endpoints / prompts (wrapping korahAPI) to return structured outputs.



Inline results in chat: Render flashcards / study guides / quizzes as rich blocks inside the chat stream (mirroring the #study-tools section visuals), so students never have to leave the conversation to use tools.



"Tools" drawer: Add a small tab or icon on the chat card that opens a drawer with all AI tools (Flashcards, Study Guide, Practice Test), sharing logic with the existing studyTools() component in korah.js.

3. Settings & personalization panel





Global settings surface: Add a Settings entry to the navbar or chat header that opens a modal or side panel, backed by new state in app().



Study preferences: Toggles and sliders for things like:





Default focus length for the timer() widget (e.g., 25 vs 45 minutes)



Preferred explanation depth (concise vs detailed) that affects the system prompt passed into korahAPI



Default quiz length and difficulty for practice tests.



Accessibility & theme: Controls for font size, message density (compact vs cozy), and optional high-contrast mode on top of your existing dark/light theme toggle.



Privacy controls: Per-device options to enable/disable chat history, clear all data, and show what’s stored locally.

4. Automatic follow-up prompts & suggested flows





Smart follow-up chips: After each AI message (in chatWidget().messages), render small suggestion chips like "Quiz me on this", "Summarize", "Make flashcards", generated from simple heuristics (e.g., if the reply is explanatory text, show quiz/flashcards; if it’s a plan, show "Turn into schedule").



Next-step banners: For certain reply types (e.g., when AI builds a study plan), show a non-intrusive banner at the bottom of the chat card offering 1–2 key next actions, such as starting a focus timer with a recommended duration.



Contextual integration with mood widget: When a user selects a mood in moodWidget(), pre-fill the chat input with a suggestion ("I picked yellow. What 1–2 tasks should I do?") and optionally auto-send it for them.

5. Modes / personas for different study needs





Chat "mode" toggle: Add a mode switch in the chat header (e.g., Tutor, Planner, Coach, Exam Cram). The selected mode alters the system prompt used in korahAPI so Korah responds differently without changing the UI.



Mode-aware tools: Align quick tools with the active mode:





Tutor: Emphasize step-by-step explanations and worked examples.



Planner: Focus on scheduling, priority, and timeboxing tasks.



Coach: Short, motivational responses and accountability check-ins.



Exam Cram: Aggressive quizzing, error correction, and spaced recall.



Visual affordances: Subtle label and color cues (icon + text near the chat title) so students can see which mode they’re in at a glance.

6. Study-day structure & automation





Daily start flow: On first visit each day, show a lightweight "What’s today like?" card that:





Asks mood (reuse moodWidget())



Lets users select 1–3 tasks from a list



Optionally kicks off a first focus session.



Session logs: After each timer() run, log the session (subject, duration, perceived difficulty) and surface weekly totals in the Features section’s streak cards.



Gentle reminders: If a user is idle for a while with an unfinished session or plan, show a small in-app nudge (no push notifications) linking back to the chat or timer.

7. Implementation notes





Where to hook in:





Chat-centered features live in the #chat section of index.html and the chatWidget() Alpine component in korah.js.



Tool surfaces extend the studyTools() Alpine component and share styling with existing flashcard / guide / quiz demos.



Global settings and modes extend the app() state and are rendered via a new modal or drawer in index.html.



Data & storage: Use localStorage for per-device persistence (sessions, settings, streaks), keeping anything sensitive easy to clear from the Settings panel.



Incremental rollout: Implement in thin vertical slices (e.g., persistent single-session history → multi-session → export), so you can ship improvements without large refactors.
