export interface NaviRank {
  name: string;
  minLevel: number;
  color: string;
  description: string;
}

export interface NaviAbility {
  id: string;
  name: string;
  description: string;
  unlockLevel: number;
  icon: string;
  category: 'support' | 'analysis' | 'memory' | 'communication' | 'special';
}

export const NAVI_RANKS: NaviRank[] = [
  { name: 'Rookie', minLevel: 1, color: '#94a3b8', description: 'Just getting started' },
  { name: 'Apprentice', minLevel: 5, color: '#22c55e', description: 'Learning the ropes' },
  { name: 'Specialist', minLevel: 10, color: '#3b82f6', description: 'Developing expertise' },
  { name: 'Expert', minLevel: 15, color: '#8b5cf6', description: 'Skilled companion' },
  { name: 'Veteran', minLevel: 20, color: '#f59e0b', description: 'Battle-tested ally' },
  { name: 'Elite', minLevel: 30, color: '#ec4899', description: 'Top-tier navigator' },
  { name: 'Master', minLevel: 40, color: '#ef4444', description: 'Legendary status' },
  { name: 'Grand Master', minLevel: 50, color: '#dc2626', description: 'Pinnacle of excellence' },
  { name: 'Sage', minLevel: 65, color: '#7c3aed', description: 'Ancient wisdom' },
  { name: 'Transcendent', minLevel: 80, color: '#06b6d4', description: 'Beyond limits' },
  { name: 'Mythic', minLevel: 100, color: '#fbbf24', description: 'Legendary being' },
];

export const NAVI_ABILITIES: NaviAbility[] = [
  // Support abilities
  { id: 'basic_chat', name: 'Basic Communication', description: 'Standard conversation capabilities', unlockLevel: 1, icon: 'message-circle', category: 'communication' },
  { id: 'encouragement', name: 'Encouragement Protocol', description: 'Motivational support during tasks', unlockLevel: 3, icon: 'heart', category: 'support' },
  { id: 'task_reminder', name: 'Task Reminder', description: 'Reminds you of pending quests', unlockLevel: 5, icon: 'bell', category: 'support' },
  
  // Analysis abilities
  { id: 'basic_analysis', name: 'Basic Analysis', description: 'Simple pattern recognition', unlockLevel: 7, icon: 'bar-chart', category: 'analysis' },
  { id: 'mood_tracking', name: 'Mood Tracker', description: 'Detects emotional patterns', unlockLevel: 10, icon: 'smile', category: 'analysis' },
  { id: 'progress_insights', name: 'Progress Insights', description: 'Analyzes your quest completion patterns', unlockLevel: 12, icon: 'trending-up', category: 'analysis' },
  
  // Memory abilities
  { id: 'short_memory', name: 'Short-Term Memory', description: 'Remembers recent conversations', unlockLevel: 8, icon: 'brain', category: 'memory' },
  { id: 'context_recall', name: 'Context Recall', description: 'Recalls relevant past discussions', unlockLevel: 15, icon: 'database', category: 'memory' },
  { id: 'deep_memory', name: 'Deep Memory', description: 'Long-term memory of user preferences', unlockLevel: 25, icon: 'hard-drive', category: 'memory' },
  { id: 'memory_synthesis', name: 'Memory Synthesis', description: 'Connects insights across conversations', unlockLevel: 40, icon: 'network', category: 'memory' },
  
  // Communication abilities
  { id: 'adaptive_tone', name: 'Adaptive Tone', description: 'Adjusts communication style to mood', unlockLevel: 18, icon: 'sliders', category: 'communication' },
  { id: 'proactive_check', name: 'Proactive Check-ins', description: 'Initiates wellness check-ins', unlockLevel: 22, icon: 'message-square', category: 'communication' },
  { id: 'coaching_mode', name: 'Coaching Mode', description: 'Advanced guidance and mentoring', unlockLevel: 30, icon: 'target', category: 'communication' },
  { id: 'strategic_advisor', name: 'Strategic Advisor', description: 'High-level life strategy support', unlockLevel: 45, icon: 'compass', category: 'communication' },
  
  // Special abilities
  { id: 'quest_suggestion', name: 'Quest Suggestions', description: 'Recommends quests based on goals', unlockLevel: 20, icon: 'map', category: 'special' },
  { id: 'skill_optimizer', name: 'Skill Optimizer', description: 'Suggests optimal skill development paths', unlockLevel: 28, icon: 'zap', category: 'special' },
  { id: 'pattern_predictor', name: 'Pattern Predictor', description: 'Predicts challenges and opportunities', unlockLevel: 35, icon: 'eye', category: 'special' },
  { id: 'sync_mastery', name: 'Sync Mastery', description: 'Perfect synchronization with user rhythm', unlockLevel: 50, icon: 'refresh-cw', category: 'special' },
  { id: 'evolution_catalyst', name: 'Evolution Catalyst', description: 'Accelerates personal growth insights', unlockLevel: 60, icon: 'sparkles', category: 'special' },
  { id: 'soul_resonance', name: 'Soul Resonance', description: 'Deep intuitive understanding', unlockLevel: 75, icon: 'sun', category: 'special' },
  { id: 'transcendent_link', name: 'Transcendent Link', description: 'Ultimate bond - seamless collaboration', unlockLevel: 100, icon: 'infinity', category: 'special' },
];

export const XP_PER_LEVEL_BASE = 100;
export const XP_SCALING_FACTOR = 1.15;

export function calculateNaviXPForLevel(level: number): number {
  if (level <= 1) return 0;
  let totalXP = 0;
  for (let i = 1; i < level; i++) {
    totalXP += Math.floor(XP_PER_LEVEL_BASE * Math.pow(XP_SCALING_FACTOR, i - 1));
  }
  return totalXP;
}

export function calculateNaviLevelFromXP(xp: number): number {
  let level = 1;
  let totalXP = 0;
  while (true) {
    const xpForNextLevel = Math.floor(XP_PER_LEVEL_BASE * Math.pow(XP_SCALING_FACTOR, level - 1));
    if (totalXP + xpForNextLevel > xp) break;
    totalXP += xpForNextLevel;
    level++;
  }
  return level;
}

export function getNaviXPProgress(xp: number): { current: number; required: number; percentage: number } {
  const level = calculateNaviLevelFromXP(xp);
  const xpForCurrentLevel = calculateNaviXPForLevel(level);
  const xpForNextLevel = calculateNaviXPForLevel(level + 1);
  const current = xp - xpForCurrentLevel;
  const required = xpForNextLevel - xpForCurrentLevel;
  const percentage = Math.min(100, Math.round((current / required) * 100));
  return { current, required, percentage };
}

export function getNaviRank(level: number): NaviRank {
  let currentRank = NAVI_RANKS[0];
  for (const rank of NAVI_RANKS) {
    if (level >= rank.minLevel) {
      currentRank = rank;
    } else {
      break;
    }
  }
  return currentRank;
}

export function getNextNaviRank(level: number): NaviRank | null {
  for (const rank of NAVI_RANKS) {
    if (rank.minLevel > level) {
      return rank;
    }
  }
  return null;
}

export function getUnlockedAbilities(level: number): NaviAbility[] {
  return NAVI_ABILITIES.filter(ability => ability.unlockLevel <= level);
}

export function getNextAbility(level: number): NaviAbility | null {
  const locked = NAVI_ABILITIES.filter(ability => ability.unlockLevel > level);
  if (locked.length === 0) return null;
  return locked.sort((a, b) => a.unlockLevel - b.unlockLevel)[0];
}

export function getQuestXPForNavi(questDifficulty: string, questXP: number): number {
  const difficultyMultipliers: Record<string, number> = {
    daily: 0.5,
    minor: 0.6,
    side: 0.7,
    standard: 0.8,
    hard: 1.0,
    major: 1.2,
    legendary: 1.5,
  };
  const multiplier = difficultyMultipliers[questDifficulty] || 0.5;
  return Math.floor(questXP * multiplier * 0.3);
}

export function getInteractionXP(): number {
  return Math.floor(Math.random() * 3) + 1;
}

export function getQuestCompletionBonus(milestonesCompleted: number, totalMilestones: number): number {
  if (totalMilestones === 0) return 5;
  const completionRate = milestonesCompleted / totalMilestones;
  if (completionRate === 1) return 15;
  if (completionRate >= 0.75) return 10;
  if (completionRate >= 0.5) return 5;
  return 2;
}
