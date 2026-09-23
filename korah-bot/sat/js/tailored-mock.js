/**
 * Local-preview placeholder data for tailored.html.
 *
 * Only runs on localhost. Stands in for window.KorahSATAnalytics so the
 * page renders a full priority list, practice-set card and limited-evidence
 * section without a signed-in account or real practice history.
 */
(function () {
  const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]", ""];
  if (!LOCAL_HOSTS.includes(location.hostname)) return;

  const diff = (attempts, correct) => ({ attempts, correct });
  const daysAgo = (days) => new Date(Date.now() - days * 86400000).toISOString();

  const SKILL_STATS = [
    {
      skillCd: "P.C.",
      attempts: 18,
      correct: 6,
      lastSeen: daysAgo(1),
      byDifficulty: { E: diff(4, 3), M: diff(8, 2), H: diff(6, 1) },
    },
    {
      skillCd: "BOU",
      attempts: 14,
      correct: 6,
      lastSeen: daysAgo(3),
      byDifficulty: { E: diff(5, 3), M: diff(6, 2), H: diff(3, 1) },
    },
    {
      skillCd: "Q.C.",
      attempts: 11,
      correct: 5,
      lastSeen: daysAgo(6),
      byDifficulty: { E: diff(4, 3), M: diff(4, 1), H: diff(3, 1) },
    },
    {
      skillCd: "INF",
      attempts: 9,
      correct: 5,
      lastSeen: daysAgo(9),
      byDifficulty: { E: diff(3, 2), M: diff(4, 2), H: diff(2, 1) },
    },
    {
      skillCd: "H.D.",
      attempts: 8,
      correct: 6,
      lastSeen: daysAgo(12),
      byDifficulty: { E: diff(3, 3), M: diff(3, 2), H: diff(2, 1) },
    },
    {
      skillCd: "TRA",
      attempts: 6,
      correct: 5,
      lastSeen: daysAgo(15),
      byDifficulty: { E: diff(2, 2), M: diff(3, 2), H: diff(1, 1) },
    },
    { skillCd: "CTC", attempts: 2, correct: 0, lastSeen: daysAgo(4), byDifficulty: { E: diff(1, 0), M: diff(1, 0), H: diff(0, 0) } },
    { skillCd: "SYN", attempts: 2, correct: 1, lastSeen: daysAgo(8), byDifficulty: { E: diff(0, 0), M: diff(2, 1), H: diff(0, 0) } },
    { skillCd: "P.A.", attempts: 1, correct: 0, lastSeen: daysAgo(11), byDifficulty: { E: diff(0, 0), M: diff(1, 0), H: diff(0, 0) } },
  ];

  // One attempt row per answered question, newest first, so the per-card
  // "Practice missed problems" option has a history to filter.
  const ATTEMPTS = SKILL_STATS.flatMap((skill, skillIndex) =>
    Array.from({ length: skill.attempts }, (_, index) => ({
      questionId: `mock-${skillIndex + 1}-${index + 1}`,
      detailKey: `mock-${skillIndex + 1}-${index + 1}`,
      skillCd: skill.skillCd,
      correct: index < skill.correct,
      difficulty: ["E", "M", "H"][index % 3],
      ts: daysAgo(skillIndex + index / 10),
    }))
  ).sort((a, b) => b.ts.localeCompare(a.ts));

  window.KorahSATAnalytics = {
    isLocalPreviewMock: true,
    getAllSkillStats: async () => SKILL_STATS,
    getAllAttempts: async () => ATTEMPTS,
    getRecentAttempts: async (limit) => ATTEMPTS.slice(0, limit || ATTEMPTS.length),
  };

  console.info("[Tailored] local preview mock analytics active");
})();
