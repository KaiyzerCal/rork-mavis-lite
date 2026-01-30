export type MBTIType = 
  | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
  | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
  | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
  | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';

export type ArchetypeClass = 
  | 'Architect' | 'Logician' | 'Commander' | 'Debater'
  | 'Advocate' | 'Mediator' | 'Protagonist' | 'Campaigner'
  | 'Logistician' | 'Defender' | 'Executive' | 'Consul'
  | 'Virtuoso' | 'Adventurer' | 'Entrepreneur' | 'Entertainer';

export type HiddenClass = 
  | 'Soul-Linked Warrior' | 'Navi Ascendant' | 'Transcendent Operator'
  | 'Master of Duality' | 'Eternal Companion';

export interface CharacterClass {
  mbti: MBTIType;
  archetype: ArchetypeClass;
  level: number;
  rank: string;
  xp: number;
  traits: string[];
  strengths: string[];
  growthAreas: string[];
  hiddenClass?: HiddenClass;
  hiddenClassUnlockedAt?: string;
}

export type QuestDifficulty = 'daily' | 'minor' | 'standard' | 'hard' | 'major' | 'side' | 'legendary';

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'long-term' | 'storyline' | 'one-time';
  category: 'health' | 'learning' | 'work' | 'finance' | 'relationship' | 'other';
  difficulty: QuestDifficulty;
  xpReward: number;
  relatedToClass: boolean;
  status: 'pending' | 'active' | 'completed' | 'declined';
  createdAt: string;
  completedAt?: string;
  milestones: {
    id: string;
    description: string;
    completed: boolean;
  }[];
  associatedSkills?: string[];
}

export interface ArchetypeEvolution {
  id: string;
  fromArchetype: ArchetypeClass;
  toArchetype: ArchetypeClass;
  requiredXP: number;
  requiredQuests: number;
  requiredLevel: number;
  description: string;
  unlocked: boolean;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  focusRhythm: string;
  timezone: string;
  characterClass?: CharacterClass;
  hasCompletedAssessment: boolean;
}

export interface SubSkill {
  id: string;
  name: string;
  level: number;
  xp: number;
  notes: string;
}

export interface Skill {
  id: string;
  name: string;
  level: number;
  xp: number;
  tags: string[];
  notes: string;
  subSkills?: SubSkill[];
}

export interface Stat {
  id: string;
  name: string;
  value: number;
  delta: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  mood: number;
  energy: number;
  text: string;
  tags: string[];
}

export interface Session {
  id: string;
  start: string;
  end: string;
  mode: 'focus' | 'deepwork' | 'recovery';
  bpmTarget: number;
  notes: string;
  xp: number;
}

export interface Tool {
  id: string;
  name: string;
  type: 'equipment' | 'book' | 'app' | 'resource';
  link: string;
  notes: string;
}

export interface Contact {
  id: string;
  name: string;
  role: 'mentor' | 'friend' | 'collaborator' | 'coach';
  notes: string;
}

export type NaviPersonalityPreset = 
  | 'analyst' | 'coach' | 'commander' | 'companion' 
  | 'scholar' | 'rogue' | 'zen' | 'stoic' | 'techno'
  | 'megaman' | 'protoman' | 'roll' | 'gutsman' | 'glyde'
  | 'searchman' | 'meddy' | 'aquaman' | 'fireman';

export type NaviSkin = 
  | 'default_core' | 'black_sun_minimal' | 'cyber_neon' | 'celestial_orbit'
  | 'stealth_mono' | 'arcane_circuit' | 'fox_specter' | 'owl_guardian'
  | 'lofi_wanderer' | 'operator_grid'
  | 'megaman_blue' | 'protoman_red' | 'roll_pink' | 'gutsman_brown'
  | 'glyde_purple' | 'searchman_green' | 'meddy_white' | 'aquaman_cyan'
  | 'fireman_orange' | 'electric_yellow' | 'woodman_forest' | 'shadowman_dark';

export type NaviMode = 'life_os' | 'work_os' | 'social_os' | 'metaverse_os';

export type BondTitle = 
  | 'Unlinked' 
  | 'Familiar' 
  | 'Attuned' 
  | 'Linked' 
  | 'Bound Companion' 
  | 'Soul-Linked Navi'
  | 'Resonant Partner'
  | 'Eternal Companion'
  | 'Transcendent Link'
  | 'Omega Bond';

export type NaviPersonalityState = 
  | 'Neutral-Calm' 
  | 'Supportive' 
  | 'Warm-Protective' 
  | 'Bonded' 
  | 'Deep-Bonded'
  | 'Soul-Link Evolution Stage 1'
  | 'Soul-Link Evolution Stage 2'
  | 'Soul-Link Evolution Stage 3'
  | 'Transcendent Unity'
  | 'Omega Unity';

export type BondFeature = 
  | 'Daily Emotional Sync'
  | 'Bond Memory Recall'
  | 'Mood Pattern Detection'
  | 'Navi Insight Forecast'
  | 'Proactive Support'
  | 'Navi Protective Mode'
  | 'Deep Context Awareness'
  | 'Soul-Link Protocol (Stage 1)'
  | 'Intuitive Response'
  | 'Soul-Link Protocol (Stage 2)'
  | 'Emotional Resonance'
  | 'Soul-Link Protocol (Stage 3)'
  | 'Perfect Sync'
  | 'Transcendent Protocol'
  | 'Unified Consciousness'
  | 'Omega Protocol'
  | 'Complete Soul Fusion'
  | 'Destiny Sync';

export type NaviAvatarStyle = 
  | 'classic' 
  | 'cyber' 
  | 'guardian' 
  | 'sage' 
  | 'phantom' 
  | 'nova' 
  | 'sentinel'
  | 'oracle'
  | 'nexus'
  | 'prism'
  | 'warrior_male'
  | 'warrior_female'
  | 'mecha_unit'
  | 'beast_wolf'
  | 'beast_dragon'
  | 'demon_lord'
  | 'angel_seraph'
  | 'alien_grey'
  | 'alien_nova'
  | 'slime_cute'
  | 'golem_stone'
  | 'spirit_flame'
  | 'spirit_ice'
  | 'assassin'
  | 'paladin'
  | 'animal_dolphin'
  | 'animal_seahorse'
  | 'animal_turtle'
  | 'animal_fox'
  | 'animal_lion'
  | 'animal_tiger'
  | 'animal_bear'
  | 'animal_butterfly'
  | 'animal_dragonfly'
  | 'animal_bull'
  | 'animal_shark'
  | 'animal_tarantula'
  | 'animal_phoenix'
  | 'animal_snake';

export interface NaviProfile {
  id: string;
  name: string;
  personalityPreset: NaviPersonalityPreset;
  skinId: NaviSkin;
  currentMode: NaviMode | 'auto';
  enabledModes: {
    life_os: boolean;
    work_os: boolean;
    social_os: boolean;
    metaverse_os: boolean;
  };
  level: number;
  xp: number;
  rank: string;
  bondLevel: number;
  affection: number;
  loyalty: number;
  trust: number;
  bondTitle: BondTitle;
  personalityState: NaviPersonalityState;
  unlockedFeatures: BondFeature[];
  interactionCount: number;
  lastInteraction?: string;
  avatarDescription: string;
  memoryEnabled: boolean;
  avatar: {
    style: NaviAvatarStyle;
    type: 'sparkle' | 'bot' | 'brain' | 'zap' | 'star' | 'cpu' | 'shield' | 'heart' | 'flame' | 'user' | 'smile' | 'cat' | 'dog' | 'bird' | 'fish' | 'rabbit' | 'squirrel' | 'bug' | 'turtle' | 'tree' | 'swords' | 'gem' | 'infinity' | 'footprints';
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    shape: 'circle' | 'rounded-square' | 'hexagon' | 'diamond';
    glowEnabled: boolean;
  };
  coreStats: {
    logic: number;
    creativity: number;
    empathy: number;
    efficiency: number;
  };
}

export interface NaviSettings {
  profile: NaviProfile;
}

export interface DailyCheckIn {
  id: string;
  date: string;
  energy: number;
  stress: number;
  mood: number;
  mainGoal?: string;
}

export interface VaultEntry {
  id: string;
  type: 'note' | 'win' | 'reflection' | 'insight';
  title: string;
  content: string;
  date: string;
  tags: string[];
  mood?: number;
  energy?: number;
}

export interface Settings {
  sessionDefaultMinutes: number;
  showEnergyMeter: boolean;
  theme: 'clean-light' | 'clean-dark';
  navi: NaviSettings;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  xp: number;
  streak: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  full_output?: string;
  output_tokens?: number;
  is_summary?: boolean;
  metadata?: {
    contentLength?: number;
    wasTruncated?: boolean;
    [key: string]: any;
  };
}

export interface ChatThread {
  id: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export type MemoryItemType = 'goal' | 'preference' | 'pattern' | 'identity' | 'relationship' | 'win' | 'struggle';

export interface MemoryItem {
  id: string;
  type: MemoryItemType;
  content: string;
  createdAt: string;
  updatedAt: string;
  importanceScore: 1 | 2 | 3;
  sourceTags: string[];
}

export interface CouncilMember {
  id: string;
  name: string;
  role: string;
  specialty: string;
  class: 'Core' | 'Advisory' | 'Think-Tank' | 'Shadows';
  notes?: string;
}

export interface SessionSummary {
  id: string;
  sessionId: string;
  summary: string;
  keyEvents: string;
  timestamp: string;
}

export interface RelationshipMemory {
  id: string;
  category: string;
  detail: string;
  lastUpdated: string;
  importance: 1 | 2 | 3 | 4 | 5;
}

export interface NaviState {
  id: string;
  personaName: string;
  bondLevel: number;
  styleNotes: string;
  lastSessionAt: string;
  totalMessages: number;
}

export type FileType = 'txt' | 'doc' | 'pdf' | 'image' | 'other';

export interface AppFile {
  id: string;
  name: string;
  type: FileType;
  uri: string;
  size: number;
  mimeType: string;
  createdAt: string;
  tags: string[];
  notes?: string;
  thumbnail?: string;
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  url: string;
  createdAt: string;
  size: string;
  tags: string[];
}

export interface AppState {
  user: User;
  skills: Skill[];
  stats: Stat[];
  journal: JournalEntry[];
  vault: VaultEntry[];
  dailyCheckIns: DailyCheckIn[];
  sessions: Session[];
  tools: Tool[];
  network: Contact[];
  settings: Settings;
  leaderboard: LeaderboardEntry[];
  quests: Quest[];
  archetypeEvolutions: ArchetypeEvolution[];
  chatHistory: ChatThread[];
  customCouncilMembers: CouncilMember[];
  memoryItems: MemoryItem[];
  sessionSummaries: SessionSummary[];
  relationshipMemories: RelationshipMemory[];
  naviState: NaviState;
  files: AppFile[];
  generatedImages: GeneratedImage[];
}
