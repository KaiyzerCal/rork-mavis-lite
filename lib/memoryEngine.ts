import { SQLiteStorage } from '@/lib/storage';
import type { MemoryItem, RelationshipMemory, SessionSummary, AppState } from '@/types';

const LTM_COMPRESSED_KEY = '@navi_ltm_compressed';

export interface CompressedMemoryBlock {
  id: string;
  category: 'identity' | 'goals' | 'preferences' | 'relationships' | 'struggles' | 'achievements' | 'patterns' | 'context';
  summary: string;
  details: string[];
  importance: number;
  sourceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LongTermMemoryStore {
  version: number;
  lastCompressed: string;
  blocks: CompressedMemoryBlock[];
  rawMemoryCount: number;
  compressionRuns: number;
}

const EMPTY_LTM: LongTermMemoryStore = {
  version: 2,
  lastCompressed: '',
  blocks: [],
  rawMemoryCount: 0,
  compressionRuns: 0,
};

export async function loadLongTermMemory(): Promise<LongTermMemoryStore> {
  try {
    const stored = await SQLiteStorage.getItem(LTM_COMPRESSED_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as LongTermMemoryStore;
      console.log('[LTM] Loaded', parsed.blocks.length, 'compressed memory blocks');
      return parsed;
    }
  } catch (error) {
    console.error('[LTM] Failed to load long-term memory:', error);
  }
  return { ...EMPTY_LTM };
}

export async function saveLongTermMemory(store: LongTermMemoryStore): Promise<void> {
  try {
    await SQLiteStorage.setItem(LTM_COMPRESSED_KEY, JSON.stringify(store));
    console.log('[LTM] Saved', store.blocks.length, 'compressed memory blocks');
  } catch (error) {
    console.error('[LTM] Failed to save long-term memory:', error);
  }
}

function categorizeMemory(item: MemoryItem): CompressedMemoryBlock['category'] {
  switch (item.type) {
    case 'identity': return 'identity';
    case 'goal': return 'goals';
    case 'preference': return 'preferences';
    case 'relationship': return 'relationships';
    case 'struggle': return 'struggles';
    case 'win': return 'achievements';
    case 'pattern': return 'patterns';
    default: return 'context';
  }
}

function categorizeRelMemory(mem: RelationshipMemory): CompressedMemoryBlock['category'] {
  const cat = mem.category.toLowerCase();
  if (cat.includes('goal') || cat.includes('plan') || cat.includes('want')) return 'goals';
  if (cat.includes('prefer') || cat.includes('like') || cat.includes('love') || cat.includes('hate')) return 'preferences';
  if (cat.includes('identity') || cat.includes('am') || cat.includes('personal')) return 'identity';
  if (cat.includes('relation') || cat.includes('friend') || cat.includes('family') || cat.includes('partner')) return 'relationships';
  if (cat.includes('struggle') || cat.includes('challenge') || cat.includes('difficult')) return 'struggles';
  if (cat.includes('win') || cat.includes('achieve') || cat.includes('success')) return 'achievements';
  if (cat.includes('pattern') || cat.includes('habit') || cat.includes('routine')) return 'patterns';
  return 'context';
}

export function compressMemories(
  memoryItems: MemoryItem[],
  relationshipMemories: RelationshipMemory[],
  sessionSummaries: SessionSummary[],
  existingBlocks: CompressedMemoryBlock[]
): CompressedMemoryBlock[] {
  console.log('[LTM:Compress] Starting compression...');
  console.log('[LTM:Compress] Input: memoryItems=', memoryItems.length, 'relMemories=', relationshipMemories.length, 'sessions=', sessionSummaries.length);

  const blockMap = new Map<string, CompressedMemoryBlock>();

  for (const block of existingBlocks) {
    blockMap.set(block.category, { ...block });
  }

  for (const item of memoryItems) {
    const category = categorizeMemory(item);
    const existing = blockMap.get(category);
    const detail = item.content.trim();

    if (!detail || detail.length < 5) continue;

    if (existing) {
      const isDuplicate = existing.details.some(d =>
        d.toLowerCase().includes(detail.toLowerCase().substring(0, 30)) ||
        detail.toLowerCase().includes(d.toLowerCase().substring(0, 30))
      );
      if (!isDuplicate) {
        existing.details.push(detail);
        existing.sourceCount += 1;
        existing.importance = Math.max(existing.importance, item.importanceScore);
        existing.updatedAt = new Date().toISOString();
      }
    } else {
      blockMap.set(category, {
        id: `ltm-${category}-${Date.now()}`,
        category,
        summary: `${category.charAt(0).toUpperCase() + category.slice(1)} information`,
        details: [detail],
        importance: item.importanceScore,
        sourceCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  for (const mem of relationshipMemories) {
    const category = categorizeRelMemory(mem);
    const existing = blockMap.get(category);
    const detail = `[${mem.category}] ${mem.detail}`.trim();

    if (!detail || detail.length < 5) continue;

    if (existing) {
      const isDuplicate = existing.details.some(d =>
        d.toLowerCase().includes(detail.toLowerCase().substring(0, 30)) ||
        detail.toLowerCase().includes(d.toLowerCase().substring(0, 30))
      );
      if (!isDuplicate) {
        existing.details.push(detail);
        existing.sourceCount += 1;
        existing.importance = Math.max(existing.importance, mem.importance);
        existing.updatedAt = new Date().toISOString();
      }
    } else {
      blockMap.set(category, {
        id: `ltm-${category}-${Date.now()}`,
        category,
        summary: `${category.charAt(0).toUpperCase() + category.slice(1)} information`,
        details: [detail],
        importance: mem.importance,
        sourceCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  if (sessionSummaries.length > 0) {
    const contextBlock = blockMap.get('context') || {
      id: `ltm-context-${Date.now()}`,
      category: 'context' as const,
      summary: 'Session history and context',
      details: [],
      importance: 2,
      sourceCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    for (const session of sessionSummaries.slice(-10)) {
      const detail = `[Session ${session.timestamp}] ${session.summary} | ${session.keyEvents}`;
      const isDuplicate = contextBlock.details.some(d =>
        d.includes(session.sessionId)
      );
      if (!isDuplicate) {
        contextBlock.details.push(detail);
        contextBlock.sourceCount += 1;
        contextBlock.updatedAt = new Date().toISOString();
      }
    }

    blockMap.set('context', contextBlock);
  }

  for (const [, block] of blockMap) {
    if (block.details.length > 50) {
      block.details = block.details.slice(-50);
    }
    block.summary = generateBlockSummary(block);
  }

  const result = Array.from(blockMap.values());
  console.log('[LTM:Compress] Output:', result.length, 'blocks with', result.reduce((sum, b) => sum + b.details.length, 0), 'total details');
  return result;
}

function generateBlockSummary(block: CompressedMemoryBlock): string {
  const count = block.details.length;
  switch (block.category) {
    case 'identity': return `User identity & self-description (${count} facts)`;
    case 'goals': return `Active goals & aspirations (${count} items)`;
    case 'preferences': return `Preferences & likes/dislikes (${count} items)`;
    case 'relationships': return `Relationships & social connections (${count} entries)`;
    case 'struggles': return `Challenges & difficulties (${count} noted)`;
    case 'achievements': return `Wins & accomplishments (${count} recorded)`;
    case 'patterns': return `Behavioral patterns & habits (${count} observed)`;
    case 'context': return `Session history & context (${count} sessions)`;
    default: return `${block.category} (${count} items)`;
  }
}

export function buildSystemStateBlock(state: AppState, ltmBlocks: CompressedMemoryBlock[]): string {
  const lines: string[] = [];

  lines.push('========== SYSTEM STATE BLOCK ==========');
  lines.push('(Navi has full read access to all app data)');
  lines.push('');

  lines.push('--- USER PROFILE ---');
  lines.push(`Name: ${state.user.name}`);
  if (state.user.characterClass) {
    const cc = state.user.characterClass;
    lines.push(`Class: ${cc.archetype} (${cc.mbti})`);
    lines.push(`Level: ${cc.level} | Rank: ${cc.rank} | XP: ${cc.xp}`);
    if (cc.hiddenClass) {
      lines.push(`Hidden Class: ${cc.hiddenClass}`);
    }
  }
  lines.push('');

  lines.push('--- NAVI PROFILE ---');
  const navi = state.settings.navi.profile;
  lines.push(`Name: ${navi.name} | Level: ${navi.level} | Rank: ${navi.rank}`);
  lines.push(`Bond: Lv${navi.bondLevel} "${navi.bondTitle}" | Affection: ${navi.affection} | Trust: ${navi.trust} | Loyalty: ${navi.loyalty}`);
  lines.push(`Personality: ${navi.personalityPreset} | Mode: ${navi.currentMode}`);
  lines.push(`Interactions: ${navi.interactionCount} | XP: ${navi.xp}`);
  lines.push('');

  const pendingQuests = state.quests.filter(q => q.status === 'pending');
  const activeQuests = state.quests.filter(q => q.status === 'active');
  const completedQuests = state.quests.filter(q => q.status === 'completed');
  const declinedQuests = state.quests.filter(q => q.status === 'declined');

  lines.push(`--- QUESTS (${state.quests.length} total) ---`);
  lines.push(`Pending: ${pendingQuests.length} | Active: ${activeQuests.length} | Completed: ${completedQuests.length} | Declined: ${declinedQuests.length}`);

  if (activeQuests.length > 0) {
    lines.push('');
    lines.push('[ACTIVE QUESTS]');
    for (const q of activeQuests) {
      const completedMilestones = q.milestones.filter(m => m.completed).length;
      lines.push(`  * "${q.title}" [${q.category}/${q.difficulty}] XP:${q.xpReward}`);
      lines.push(`    ${q.description}`);
      lines.push(`    Progress: ${completedMilestones}/${q.milestones.length} milestones`);
      for (const m of q.milestones) {
        lines.push(`      ${m.completed ? '[x]' : '[ ]'} ${m.description}`);
      }
    }
  }

  if (pendingQuests.length > 0) {
    lines.push('');
    lines.push('[PENDING QUESTS]');
    for (const q of pendingQuests.slice(0, 10)) {
      lines.push(`  * "${q.title}" [${q.category}/${q.difficulty}] XP:${q.xpReward}`);
      lines.push(`    ${q.description}`);
    }
  }

  if (completedQuests.length > 0) {
    lines.push('');
    lines.push(`[COMPLETED QUESTS - last 10 of ${completedQuests.length}]`);
    for (const q of completedQuests.slice(-10)) {
      lines.push(`  * "${q.title}" [${q.category}] XP:${q.xpReward} completed:${q.completedAt || 'unknown'}`);
    }
  }
  lines.push('');

  lines.push(`--- VAULT (${state.vault.length} entries) ---`);
  if (state.vault.length > 0) {
    for (const v of state.vault.slice(0, 20)) {
      lines.push(`  [${v.type.toUpperCase()}] "${v.title}" (${v.date})`);
      lines.push(`    ${v.content.substring(0, 200)}${v.content.length > 200 ? '...' : ''}`);
      if (v.tags.length > 0) {
        lines.push(`    Tags: ${v.tags.join(', ')}`);
      }
      if (v.mood !== undefined) {
        lines.push(`    Mood: ${v.mood}/10${v.energy !== undefined ? ` | Energy: ${v.energy}/10` : ''}`);
      }
    }
    if (state.vault.length > 20) {
      lines.push(`  ... and ${state.vault.length - 20} more entries`);
    }
  }
  lines.push('');

  lines.push(`--- SKILLS (${state.skills.length}) ---`);
  if (state.skills.length > 0) {
    for (const s of state.skills) {
      lines.push(`  * ${s.name} Lv.${s.level} (${s.xp} XP) [${s.tags.join(', ')}]`);
      if (s.notes) lines.push(`    Notes: ${s.notes}`);
      if (s.subSkills && s.subSkills.length > 0) {
        for (const ss of s.subSkills) {
          lines.push(`      - ${ss.name} Lv.${ss.level} (${ss.xp} XP)`);
        }
      }
    }
  }
  lines.push('');

  lines.push(`--- JOURNAL (${state.journal.length} entries) ---`);
  if (state.journal.length > 0) {
    for (const j of state.journal.slice(0, 5)) {
      lines.push(`  [${j.date}] Mood:${j.mood}/10 Energy:${j.energy}/10 - ${j.text.substring(0, 150)}${j.text.length > 150 ? '...' : ''}`);
    }
    if (state.journal.length > 5) {
      lines.push(`  ... and ${state.journal.length - 5} more entries`);
    }
  }
  lines.push('');

  lines.push(`--- DAILY CHECK-INS (${state.dailyCheckIns.length}) ---`);
  if (state.dailyCheckIns.length > 0) {
    for (const dc of state.dailyCheckIns.slice(0, 5)) {
      lines.push(`  [${dc.date}] Energy:${dc.energy} Stress:${dc.stress} Mood:${dc.mood}${dc.mainGoal ? ` Goal: ${dc.mainGoal}` : ''}`);
    }
  }
  lines.push('');

  if (ltmBlocks.length > 0) {
    lines.push('--- LONG-TERM MEMORY ---');
    for (const block of ltmBlocks) {
      lines.push(`[${block.category.toUpperCase()}] (${block.details.length} items, importance: ${block.importance})`);
      for (const detail of block.details.slice(0, 15)) {
        lines.push(`  - ${detail.substring(0, 200)}`);
      }
      if (block.details.length > 15) {
        lines.push(`  ... +${block.details.length - 15} more`);
      }
    }
    lines.push('');
  }

  const stats = {
    totalXP: state.leaderboard.find(l => l.id === 'me')?.xp || 0,
    streak: state.leaderboard.find(l => l.id === 'me')?.streak || 0,
    chatMessages: state.chatHistory.reduce((acc, t) => acc + t.messages.length, 0),
    files: state.files?.length || 0,
    images: state.generatedImages?.length || 0,
  };

  lines.push('--- STATS SUMMARY ---');
  lines.push(`Total XP: ${stats.totalXP} | Streak: ${stats.streak} days`);
  lines.push(`Chat Messages: ${stats.chatMessages} | Files: ${stats.files} | Images: ${stats.images}`);
  lines.push('========== END STATE BLOCK ==========');

  return lines.join('\n');
}

export function buildCompactMemoryContext(ltmBlocks: CompressedMemoryBlock[]): string {
  if (ltmBlocks.length === 0) return '';

  const lines: string[] = ['[NAVI LONG-TERM MEMORY]'];
  const sortedBlocks = [...ltmBlocks].sort((a, b) => b.importance - a.importance);

  for (const block of sortedBlocks) {
    lines.push(`[${block.category.toUpperCase()}]`);
    const maxDetails = block.importance >= 3 ? 10 : 5;
    for (const detail of block.details.slice(-maxDetails)) {
      lines.push(`- ${detail.substring(0, 150)}`);
    }
  }

  return lines.join('\n');
}
