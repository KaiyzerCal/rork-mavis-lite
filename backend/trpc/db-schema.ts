export interface User {
  id: string;
  name: string;
  createdAt: string;
  hasCompletedAssessment: boolean;
  characterClass?: CharacterClass;
}

export interface CharacterClass {
  mbti: string;
  archetype: string;
  level: number;
  rank: string;
  xp: number;
  traits: string[];
  strengths: string[];
  growthAreas: string[];
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  deadline?: string;
  status: 'pending' | 'active' | 'completed' | 'declined';
  createdAt: string;
  createdBy: string;
  completedAt?: string;
  xpReward: number;
  associatedSkills?: string[];
  milestones: QuestMilestone[];
}

export interface QuestMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Skill {
  id: string;
  userId: string;
  name: string;
  icon: string;
  level: number;
  xp: number;
  category: string;
  subSkills?: SubSkill[];
}

export interface SubSkill {
  id: string;
  name: string;
  level: number;
  xp: number;
}

export interface VaultEntry {
  id: string;
  userId: string;
  date: string;
  title: string;
  content: string;
  type: 'reflection' | 'achievement' | 'gratitude' | 'lesson' | 'memory' | 'insight';
  tags: string[];
  mood?: string;
}

export interface ChatThread {
  id: string;
  userId: string;
  kind: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  full_output?: string;
  timestamp: string;
  output_tokens?: number;
  is_summary?: boolean;
  metadata?: Record<string, any>;
}

export interface MemoryItem {
  id: string;
  userId: string;
  type: 'preference' | 'goal' | 'challenge' | 'insight' | 'achievement' | 'relationship';
  content: string;
  importanceScore: number;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface NaviProfile {
  userId: string;
  name: string;
  personalityPreset: string;
  personalityState: string;
  currentMode: string;
  skinId: string;
  level: number;
  xp: number;
  rank: string;
  affection: number;
  trust: number;
  loyalty: number;
  bondLevel: number;
  bondTitle: string;
  unlockedFeatures: string[];
  interactionCount: number;
  lastInteraction: string;
}

export interface DailyCheckIn {
  id: string;
  userId: string;
  date: string;
  mood: number;
  energyLevel: number;
  sleepQuality?: number;
  notes?: string;
  gratitudes?: string[];
  wins?: string[];
}

export interface Proposal {
  id: string;
  userId: string;
  threadId?: string;
  type: 'create_quest' | 'update_stats' | 'add_memory' | 'log_vault' | 'update_navi_profile';
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  payload: Record<string, any>;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  appliedAt?: string;
}

export interface SyncEvent {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  timestamp: string;
  seq: number;
}

export interface Settings {
  userId: string;
  memoryEnabled: boolean;
  dailyCheckInEnabled: boolean;
  units: 'imperial' | 'metric';
  theme?: 'light' | 'dark';
}

export interface UserFile {
  id: string;
  userId: string;
  name: string;
  type: 'txt' | 'doc' | 'pdf' | 'other';
  mimeType: string;
  size: number;
  content?: string;
  base64Data?: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  folder?: string;
}

export interface UserImage {
  id: string;
  userId: string;
  name: string;
  mimeType: string;
  size: number;
  base64Data?: string;
  url?: string;
  width?: number;
  height?: number;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  folder?: string;
  isGenerated: boolean;
  generationPrompt?: string;
}
