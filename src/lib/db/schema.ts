export const PULSAR_DB_NAME = "pulsar-prep-db";

export const PULSAR_DB_SCHEMA = {
  v1: {
    questions: "id, trackId, levelId, subject, difficulty",
    progress: "++id, questionId, userId, answeredAt, isCorrect",
    daily_state: "++id, date, userId, goalReached, pendingSync",
  },
  v2: {
    settings: "id, track, level, dailyGoal",
  },
  v3: {
    questions: "id, trackId, levelId, subject, difficulty, [trackId+levelId]",
    progress:
      "++id, questionId, userId, categoryKey, answeredAt, isCorrect, [userId+categoryKey]",
    daily_state:
      "++id, date, userId, categoryKey, goalReached, pendingSync, [userId+categoryKey+date]",
    settings: "id, track, level, dailyGoal",
  },
  v4: {
    progress:
      "++id, questionId, userId, categoryKey, answeredAt, isCorrect, isSynced, [userId+categoryKey], [userId+isSynced]",
  },
  v5: {
    questions: "id, trackId, levelId, subject, difficulty, [trackId+levelId]",
  },
} as const;
