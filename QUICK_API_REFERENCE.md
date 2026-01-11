# NAVI.EXE API QUICK REFERENCE

Quick reference for developers using the Navi Database API.

## Import

```typescript
import { useNaviAPI } from '@/contexts/NaviAPIContext';

// In component
const api = useNaviAPI();
```

## API Methods

### Stats
```typescript
await api.stats.get()
// → { level, xp, rank, characterClass, totalXP, questsCompleted, skillsCount }

await api.stats.update({ xp: 100 })
```

### Quests
```typescript
await api.quests.getAll()
await api.quests.getAll({ status: 'active' })
await api.quests.create({ title, description, type, category, xpReward, ... })
await api.quests.updateStatus(questId, 'completed')
await api.quests.acceptQuest(questId)
await api.quests.declineQuest(questId)
await api.quests.completeQuest(questId)
await api.quests.delete(questId)
```

### Skills
```typescript
await api.skills.getAll()
await api.skills.create({ name, level, xp, tags, notes })
await api.skills.updateLevel(skillId, xpDelta)
await api.skills.delete(skillId)
```

### Vault
```typescript
await api.vault.getAll()
await api.vault.getAll({ tag: 'reflection' })
await api.vault.create({ type, title, content, tags })
await api.vault.update(entryId, { title: 'New title' })
await api.vault.delete(entryId)
```

### Conversations
```typescript
await api.conversations.save({ role: 'user', content: 'Hello' })
await api.conversations.load()
await api.conversations.load(20) // last 20 messages
await api.conversations.clear()
```

### Memory
```typescript
await api.memory.save({ type, content, importanceScore, sourceTags })
await api.memory.load()
await api.memory.load({ type: 'goal' })
await api.memory.getRelevant() // top 10 by importance
await api.memory.delete(memoryId)
```

### Navi Profile
```typescript
await api.navi.getProfile()
await api.navi.updateProfile({ name, personalityPreset, skinId, ... })
await api.navi.incrementBond('message')    // +1 affection, +1 trust
await api.navi.incrementBond('positive')   // +3 affection, +2 trust, +1 loyalty
await api.navi.incrementBond('emotional')  // +2 affection, +5 trust
await api.navi.incrementInteraction()
```

### Sync
```typescript
await api.sync.omnisync()
// → { success, message, timestamp, snapshot }

await api.sync.getFullState()
```

### Daily Check-In
```typescript
await api.dailyCheckIn.create({ energy, stress, mood, mainGoal })
await api.dailyCheckIn.getToday()
```

## Type Reference

```typescript
Quest: {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'long-term' | 'storyline' | 'one-time';
  category: 'health' | 'learning' | 'work' | 'finance' | 'relationship' | 'other';
  xpReward: number;
  relatedToClass: boolean;
  status: 'pending' | 'active' | 'completed' | 'declined';
  createdAt: string;
  completedAt?: string;
  milestones: Array<{ id: string; description: string; completed: boolean }>;
  associatedSkills?: string[];
}

Skill: {
  id: string;
  name: string;
  level: number;
  xp: number;
  tags: string[];
  notes: string;
  subSkills?: SubSkill[];
}

VaultEntry: {
  id: string;
  type: 'note' | 'win' | 'reflection' | 'insight';
  title: string;
  content: string;
  date: string;
  tags: string[];
  mood?: number;
  energy?: number;
}

MemoryItem: {
  id: string;
  type: 'goal' | 'preference' | 'pattern' | 'identity' | 'relationship' | 'win' | 'struggle';
  content: string;
  createdAt: string;
  updatedAt: string;
  importanceScore: 1 | 2 | 3;
  sourceTags: string[];
}
```

## Example Usage

```typescript
import { useNaviAPI } from '@/contexts/NaviAPIContext';

function QuestCreator() {
  const api = useNaviAPI();
  
  const createDailyQuest = async () => {
    const quest = await api.quests.create({
      title: 'Morning Routine',
      description: 'Complete morning routine',
      type: 'daily',
      category: 'health',
      xpReward: 50,
      relatedToClass: false,
      milestones: [
        { id: 'm1', description: 'Wake up 6am', completed: false },
        { id: 'm2', description: 'Breakfast', completed: false },
      ]
    });
    
    console.log('Quest created:', quest);
  };
  
  const trackProgress = async () => {
    const stats = await api.stats.get();
    console.log(`Level ${stats.level} - ${stats.xp} XP`);
    
    const activeQuests = await api.quests.getAll({ status: 'active' });
    console.log(`${activeQuests.length} active quests`);
    
    const memories = await api.memory.getRelevant();
    console.log(`${memories.length} relevant memories loaded`);
  };
  
  return (
    <View>
      <Button title="Create Quest" onPress={createDailyQuest} />
      <Button title="Check Progress" onPress={trackProgress} />
    </View>
  );
}
```

---

**Full documentation**: See `MAVIS_LITE_V3.5_INSTALL_COMPLETE.md`
