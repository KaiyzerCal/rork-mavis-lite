export type QuestDifficulty = 'daily' | 'minor' | 'standard' | 'hard' | 'major' | 'side' | 'legendary';

export const QUEST_XP_VALUES: Record<QuestDifficulty, number> = {
  daily: 25,
  minor: 50,
  standard: 100,
  hard: 200,
  major: 350,
  side: 75,
  legendary: 500,
};

export const QUEST_DIFFICULTY_LABELS: Record<QuestDifficulty, string> = {
  daily: 'Daily Quest',
  minor: 'Minor Quest',
  standard: 'Standard Quest',
  hard: 'Hard Quest',
  major: 'Major Quest',
  side: 'Side Quest',
  legendary: 'Legendary Quest',
};

export const QUEST_DIFFICULTY_DESCRIPTIONS: Record<QuestDifficulty, string> = {
  daily: 'Daily habit or small task - 25 XP',
  minor: 'Quick task - 50 XP',
  standard: 'Regular challenge - 100 XP',
  hard: 'Tough objective - 200 XP',
  major: 'Significant achievement - 350 XP',
  side: 'Optional activity - 75 XP',
  legendary: 'Epic undertaking - 500 XP',
};

export const QUEST_DIFFICULTIES: QuestDifficulty[] = [
  'daily',
  'minor',
  'standard',
  'hard',
  'major',
  'side',
  'legendary',
];
