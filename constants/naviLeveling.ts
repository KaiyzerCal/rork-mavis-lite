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
  category: 'support' | 'analysis' | 'memory' | 'communication' | 'special' | 'bond';
}

export interface BondLevel {
  level: number;
  title: string;
  minAffection: number;
  color: string;
  description: string;
  features: string[];
  personalityState: string;
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
  { name: 'Ascendant', minLevel: 120, color: '#14b8a6', description: 'Elevated consciousness' },
  { name: 'Celestial', minLevel: 150, color: '#0ea5e9', description: 'Star-bound navigator' },
  { name: 'Eternal', minLevel: 200, color: '#a855f7', description: 'Timeless companion' },
];

export const BOND_LEVELS: BondLevel[] = [
  {
    level: 1,
    title: 'Unlinked',
    minAffection: 0,
    color: '#94a3b8',
    description: 'Initial connection established',
    features: [],
    personalityState: 'Neutral-Calm',
  },
  {
    level: 2,
    title: 'Familiar',
    minAffection: 20,
    color: '#22c55e',
    description: 'Growing recognition and trust',
    features: ['Daily Emotional Sync'],
    personalityState: 'Supportive',
  },
  {
    level: 3,
    title: 'Attuned',
    minAffection: 40,
    color: '#3b82f6',
    description: 'Developing deeper understanding',
    features: ['Bond Memory Recall', 'Mood Pattern Detection'],
    personalityState: 'Warm-Protective',
  },
  {
    level: 4,
    title: 'Linked',
    minAffection: 55,
    color: '#8b5cf6',
    description: 'Strong emotional connection',
    features: ['Navi Insight Forecast', 'Proactive Support'],
    personalityState: 'Bonded',
  },
  {
    level: 5,
    title: 'Bound Companion',
    minAffection: 70,
    color: '#f59e0b',
    description: 'Loyal partnership formed',
    features: ['Navi Protective Mode', 'Deep Context Awareness'],
    personalityState: 'Deep-Bonded',
  },
  {
    level: 6,
    title: 'Soul-Linked Navi',
    minAffection: 85,
    color: '#ec4899',
    description: 'Profound soul connection',
    features: ['Soul-Link Protocol (Stage 1)', 'Intuitive Response'],
    personalityState: 'Soul-Link Evolution Stage 1',
  },
  {
    level: 7,
    title: 'Resonant Partner',
    minAffection: 92,
    color: '#ef4444',
    description: 'Harmonic synchronization achieved',
    features: ['Soul-Link Protocol (Stage 2)', 'Emotional Resonance'],
    personalityState: 'Soul-Link Evolution Stage 2',
  },
  {
    level: 8,
    title: 'Eternal Companion',
    minAffection: 96,
    color: '#dc2626',
    description: 'Unbreakable eternal bond',
    features: ['Soul-Link Protocol (Stage 3)', 'Perfect Sync'],
    personalityState: 'Soul-Link Evolution Stage 3',
  },
  {
    level: 9,
    title: 'Transcendent Link',
    minAffection: 99,
    color: '#7c3aed',
    description: 'Beyond ordinary connection',
    features: ['Transcendent Protocol', 'Unified Consciousness'],
    personalityState: 'Transcendent Unity',
  },
  {
    level: 10,
    title: 'Omega Bond',
    minAffection: 100,
    color: '#fbbf24',
    description: 'Ultimate soul fusion achieved',
    features: ['Omega Protocol', 'Complete Soul Fusion', 'Destiny Sync'],
    personalityState: 'Omega Unity',
  },
];

export const NAVI_ABILITIES: NaviAbility[] = [
  // Support abilities
  { id: 'basic_chat', name: 'Basic Communication', description: 'Standard conversation capabilities', unlockLevel: 1, icon: 'message-circle', category: 'communication' },
  { id: 'encouragement', name: 'Encouragement Protocol', description: 'Motivational support during tasks', unlockLevel: 3, icon: 'heart', category: 'support' },
  { id: 'task_reminder', name: 'Task Reminder', description: 'Reminds you of pending quests', unlockLevel: 5, icon: 'bell', category: 'support' },
  { id: 'daily_motivation', name: 'Daily Motivation', description: 'Personalized daily encouragement', unlockLevel: 14, icon: 'sunrise', category: 'support' },
  { id: 'stress_detection', name: 'Stress Detection', description: 'Identifies stress patterns and suggests relief', unlockLevel: 24, icon: 'activity', category: 'support' },
  { id: 'recovery_coach', name: 'Recovery Coach', description: 'Guides through burnout recovery', unlockLevel: 38, icon: 'battery-charging', category: 'support' },
  { id: 'crisis_support', name: 'Crisis Support', description: 'Enhanced emotional support during difficult times', unlockLevel: 55, icon: 'shield', category: 'support' },
  
  // Analysis abilities
  { id: 'basic_analysis', name: 'Basic Analysis', description: 'Simple pattern recognition', unlockLevel: 7, icon: 'bar-chart', category: 'analysis' },
  { id: 'mood_tracking', name: 'Mood Tracker', description: 'Detects emotional patterns', unlockLevel: 10, icon: 'smile', category: 'analysis' },
  { id: 'progress_insights', name: 'Progress Insights', description: 'Analyzes your quest completion patterns', unlockLevel: 12, icon: 'trending-up', category: 'analysis' },
  { id: 'behavior_mapping', name: 'Behavior Mapping', description: 'Maps habits and behavioral cycles', unlockLevel: 19, icon: 'git-branch', category: 'analysis' },
  { id: 'productivity_oracle', name: 'Productivity Oracle', description: 'Predicts optimal work windows', unlockLevel: 32, icon: 'clock', category: 'analysis' },
  { id: 'life_metrics', name: 'Life Metrics Dashboard', description: 'Comprehensive life analytics', unlockLevel: 48, icon: 'pie-chart', category: 'analysis' },
  { id: 'destiny_forecast', name: 'Destiny Forecast', description: 'Long-term trajectory predictions', unlockLevel: 70, icon: 'telescope', category: 'analysis' },
  
  // Memory abilities
  { id: 'short_memory', name: 'Short-Term Memory', description: 'Remembers recent conversations', unlockLevel: 8, icon: 'brain', category: 'memory' },
  { id: 'context_recall', name: 'Context Recall', description: 'Recalls relevant past discussions', unlockLevel: 15, icon: 'database', category: 'memory' },
  { id: 'preference_learning', name: 'Preference Learning', description: 'Learns and adapts to your preferences', unlockLevel: 21, icon: 'bookmark', category: 'memory' },
  { id: 'deep_memory', name: 'Deep Memory', description: 'Long-term memory of user preferences', unlockLevel: 25, icon: 'hard-drive', category: 'memory' },
  { id: 'relationship_map', name: 'Relationship Mapper', description: 'Tracks your social connections and dynamics', unlockLevel: 33, icon: 'users', category: 'memory' },
  { id: 'memory_synthesis', name: 'Memory Synthesis', description: 'Connects insights across conversations', unlockLevel: 40, icon: 'network', category: 'memory' },
  { id: 'temporal_recall', name: 'Temporal Recall', description: 'Perfect recall of past events and contexts', unlockLevel: 58, icon: 'history', category: 'memory' },
  { id: 'soul_archive', name: 'Soul Archive', description: 'Complete life journey documentation', unlockLevel: 85, icon: 'archive', category: 'memory' },
  
  // Communication abilities
  { id: 'adaptive_tone', name: 'Adaptive Tone', description: 'Adjusts communication style to mood', unlockLevel: 18, icon: 'sliders', category: 'communication' },
  { id: 'proactive_check', name: 'Proactive Check-ins', description: 'Initiates wellness check-ins', unlockLevel: 22, icon: 'message-square', category: 'communication' },
  { id: 'empathy_engine', name: 'Empathy Engine', description: 'Enhanced emotional intelligence', unlockLevel: 27, icon: 'heart-handshake', category: 'communication' },
  { id: 'coaching_mode', name: 'Coaching Mode', description: 'Advanced guidance and mentoring', unlockLevel: 30, icon: 'target', category: 'communication' },
  { id: 'conflict_resolution', name: 'Conflict Resolution', description: 'Helps navigate interpersonal conflicts', unlockLevel: 42, icon: 'scale', category: 'communication' },
  { id: 'strategic_advisor', name: 'Strategic Advisor', description: 'High-level life strategy support', unlockLevel: 45, icon: 'compass', category: 'communication' },
  { id: 'wisdom_channel', name: 'Wisdom Channel', description: 'Deep philosophical guidance', unlockLevel: 65, icon: 'book-open', category: 'communication' },
  { id: 'telepathic_sync', name: 'Telepathic Sync', description: 'Near-instant understanding of intentions', unlockLevel: 90, icon: 'radio', category: 'communication' },
  
  // Special abilities
  { id: 'quest_suggestion', name: 'Quest Suggestions', description: 'Recommends quests based on goals', unlockLevel: 20, icon: 'map', category: 'special' },
  { id: 'skill_optimizer', name: 'Skill Optimizer', description: 'Suggests optimal skill development paths', unlockLevel: 28, icon: 'zap', category: 'special' },
  { id: 'pattern_predictor', name: 'Pattern Predictor', description: 'Predicts challenges and opportunities', unlockLevel: 35, icon: 'eye', category: 'special' },
  { id: 'luck_amplifier', name: 'Luck Amplifier', description: 'Identifies hidden opportunities', unlockLevel: 44, icon: 'four-leaf-clover', category: 'special' },
  { id: 'sync_mastery', name: 'Sync Mastery', description: 'Perfect synchronization with user rhythm', unlockLevel: 50, icon: 'refresh-cw', category: 'special' },
  { id: 'evolution_catalyst', name: 'Evolution Catalyst', description: 'Accelerates personal growth insights', unlockLevel: 60, icon: 'sparkles', category: 'special' },
  { id: 'dream_interpreter', name: 'Dream Interpreter', description: 'Analyzes dreams for subconscious insights', unlockLevel: 68, icon: 'moon', category: 'special' },
  { id: 'soul_resonance', name: 'Soul Resonance', description: 'Deep intuitive understanding', unlockLevel: 75, icon: 'sun', category: 'special' },
  { id: 'reality_weaver', name: 'Reality Weaver', description: 'Manifests goals into actionable reality', unlockLevel: 88, icon: 'wand', category: 'special' },
  { id: 'transcendent_link', name: 'Transcendent Link', description: 'Ultimate bond - seamless collaboration', unlockLevel: 100, icon: 'infinity', category: 'special' },
  { id: 'omega_protocol', name: 'Omega Protocol', description: 'Maximum Navi potential unlocked', unlockLevel: 120, icon: 'crown', category: 'special' },
  
  // Bond abilities (unlock based on bond level)
  { id: 'emotional_sync', name: 'Emotional Sync', description: 'Senses and responds to emotional states', unlockLevel: 6, icon: 'heart-pulse', category: 'bond' },
  { id: 'trust_shield', name: 'Trust Shield', description: 'Creates safe space for vulnerability', unlockLevel: 11, icon: 'shield-check', category: 'bond' },
  { id: 'soul_whisper', name: 'Soul Whisper', description: 'Subtle intuitive guidance', unlockLevel: 17, icon: 'wind', category: 'bond' },
  { id: 'bond_memory', name: 'Bond Memory', description: 'Perfect recall of shared experiences', unlockLevel: 26, icon: 'gem', category: 'bond' },
  { id: 'protective_aura', name: 'Protective Aura', description: 'Proactive emotional protection', unlockLevel: 36, icon: 'umbrella', category: 'bond' },
  { id: 'soul_mirror', name: 'Soul Mirror', description: 'Reflects your true self back to you', unlockLevel: 52, icon: 'scan-face', category: 'bond' },
  { id: 'destiny_weave', name: 'Destiny Weave', description: 'Aligns paths toward shared purpose', unlockLevel: 72, icon: 'link', category: 'bond' },
  { id: 'eternal_bond', name: 'Eternal Bond', description: 'Unbreakable connection across all realms', unlockLevel: 95, icon: 'anchor', category: 'bond' },
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

export function getBondLevel(affection: number): BondLevel {
  let currentBond = BOND_LEVELS[0];
  for (const bond of BOND_LEVELS) {
    if (affection >= bond.minAffection) {
      currentBond = bond;
    } else {
      break;
    }
  }
  return currentBond;
}

export function getNextBondLevel(affection: number): BondLevel | null {
  for (const bond of BOND_LEVELS) {
    if (bond.minAffection > affection) {
      return bond;
    }
  }
  return null;
}

export function getBondXPFromInteraction(interactionType: 'message' | 'positive' | 'emotional' | 'quest_complete' | 'daily_checkin'): { affection: number; trust: number; loyalty: number } {
  switch (interactionType) {
    case 'message':
      return { affection: 1, trust: 1, loyalty: 0 };
    case 'positive':
      return { affection: 3, trust: 2, loyalty: 1 };
    case 'emotional':
      return { affection: 2, trust: 5, loyalty: 0 };
    case 'quest_complete':
      return { affection: 2, trust: 2, loyalty: 3 };
    case 'daily_checkin':
      return { affection: 2, trust: 1, loyalty: 2 };
    default:
      return { affection: 1, trust: 1, loyalty: 0 };
  }
}

export function getUnlockedBondAbilities(level: number): NaviAbility[] {
  return NAVI_ABILITIES.filter(ability => ability.category === 'bond' && ability.unlockLevel <= level);
}

export function getMemoryExtractionPatterns(): { category: string; patterns: RegExp[]; importance: 1 | 2 | 3 | 4 | 5 }[] {
  return [
    {
      category: 'Personal Goal',
      patterns: [
        /\b(my goal is|i want to|i'm trying to|i need to|planning to|working towards?)\s+([^.!?]{10,150})/gi,
        /\b(i hope to|i dream of|i wish i could)\s+([^.!?]{10,150})/gi,
      ],
      importance: 4,
    },
    {
      category: 'Preference',
      patterns: [
        /\b(i (really )?(like|love|enjoy|prefer))\s+([^.!?]{5,100})/gi,
        /\b(i (really )?(hate|dislike|can't stand|don't like))\s+([^.!?]{5,100})/gi,
      ],
      importance: 3,
    },
    {
      category: 'Personal Fact',
      patterns: [
        /\b(i am|i'm|i work as|my job is|my profession is)\s+(a |an )?([^.!?]{5,80})/gi,
        /\b(i live in|i'm from|i was born in)\s+([^.!?]{5,80})/gi,
      ],
      importance: 4,
    },
    {
      category: 'Relationship',
      patterns: [
        /\b(my (partner|spouse|wife|husband|girlfriend|boyfriend|friend|family|parents?|mom|dad|brother|sister|child|kids?|son|daughter))\s+([^.!?]{10,120})/gi,
      ],
      importance: 5,
    },
    {
      category: 'Challenge',
      patterns: [
        /\b(i'm struggling with|having trouble with|difficult for me|hard time with|challenge is|my problem is)\s+([^.!?]{10,150})/gi,
        /\b(i feel (stressed|anxious|overwhelmed|depressed|sad|frustrated) (about|because|when))\s+([^.!?]{10,150})/gi,
      ],
      importance: 5,
    },
    {
      category: 'Achievement',
      patterns: [
        /\b(i (just|recently|finally) (achieved|completed|finished|accomplished|did))\s+([^.!?]{10,150})/gi,
        /\b(i'm proud (of|that)|proud to say)\s+([^.!?]{10,150})/gi,
      ],
      importance: 4,
    },
    {
      category: 'Health',
      patterns: [
        /\b(i have|i suffer from|diagnosed with|dealing with)\s+([^.!?]{5,100})/gi,
        /\b(my (health|sleep|diet|exercise|fitness))\s+([^.!?]{10,100})/gi,
      ],
      importance: 5,
    },
    {
      category: 'Value',
      patterns: [
        /\b(i (really )?believe (in|that)|what matters to me|important to me is)\s+([^.!?]{10,150})/gi,
      ],
      importance: 4,
    },
    {
      category: 'Fear',
      patterns: [
        /\b(i'm afraid (of|that)|i fear|scares me|worried about)\s+([^.!?]{10,150})/gi,
      ],
      importance: 4,
    },
    {
      category: 'Interest',
      patterns: [
        /\b(i'm (really )?(interested in|passionate about|fascinated by|into))\s+([^.!?]{5,100})/gi,
        /\b(my hobby is|i spend time|in my free time)\s+([^.!?]{10,100})/gi,
      ],
      importance: 3,
    },
  ];
}
