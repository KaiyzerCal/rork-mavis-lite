# MAVIS-LITE v3.5 SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                     MAVIS-LITE v3.5 NAVI.EXE                   │
│                   Full Database API + Memory                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          USER LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  📱 App Tabs:                                                    │
│  • Navi      → Profile, bond status, omnisync                   │
│  • Mavis     → Chat with persistent history                     │
│  • Character → Class, skills, quests overview                   │
│  • Quests    → Full quest management                            │
│  • Skills    → Skill tree with sub-skills                       │
│  • Vault     → Journal entries                                  │
│  • Stats     → Performance metrics                              │
│  • Settings  → Navi customization, memory controls              │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                       API LAYER (New!)                           │
├─────────────────────────────────────────────────────────────────┤
│  contexts/NaviAPIContext.tsx                                    │
│                                                                  │
│  const api = useNaviAPI();                                      │
│                                                                  │
│  📊 api.stats       → get(), update()                           │
│  🎯 api.quests      → getAll(), create(), updateStatus()        │
│  ⚡ api.skills      → getAll(), create(), updateLevel()         │
│  📖 api.vault       → getAll(), create(), update(), delete()    │
│  💬 api.conversations → save(), load(), clear()                 │
│  🧠 api.memory      → save(), load(), getRelevant()             │
│  🤖 api.navi        → getProfile(), updateProfile(), incrementBond() │
│  🔄 api.sync        → omnisync(), getFullState()                │
│  ☀️  api.dailyCheckIn → create(), getToday()                    │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  contexts/AppContext.tsx                                        │
│                                                                  │
│  📦 AppState:                                                   │
│    • user (profile, characterClass)                             │
│    • goals []                                                   │
│    • skills []                                                  │
│    • quests []                                                  │
│    • vault []                                                   │
│    • chatHistory []                                             │
│    • memoryItems []                                             │
│    • dailyCheckIns []                                           │
│    • settings.navi.profile (bond, personality, skin)            │
│                                                                  │
│  🔧 Methods:                                                    │
│    • addQuest(), completeQuest(), acceptQuest()                 │
│    • addSkill(), addSkillXP()                                   │
│    • saveChatMessage(), getChatHistory()                        │
│    • addMemoryItem(), getRelevantMemories()                     │
│    • updateNaviProfile(), incrementBondOnMessage()              │
│    • omnisync() → backup full state                             │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                     PERSISTENCE LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  AsyncStorage (@react-native-async-storage/async-storage)      │
│                                                                  │
│  🔑 Key: @mavis_lite_state                                      │
│                                                                  │
│  💾 Stores:                                                     │
│    • Complete AppState as JSON                                  │
│    • Auto-saves on every state change                           │
│    • Loads on app startup                                       │
│                                                                  │
│  🔑 Backup Keys: @mavis_lite_state_backup_{timestamp}           │
│    • Created by omnisync                                        │
│    • Last 3 backups kept (auto-cleanup)                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      AI INTEGRATION                              │
├─────────────────────────────────────────────────────────────────┤
│  @rork-ai/toolkit-sdk (useRorkAgent)                            │
│                                                                  │
│  System Prompt includes:                                        │
│    • User profile (name, timezone, focus rhythm)                │
│    • Character class (archetype, MBTI, traits, strengths)       │
│    • ALL goals (with progress %)                                │
│    • ALL skills (with levels and XP)                            │
│    • ALL quests (pending, active, completed, declined)          │
│    • Recent journal entries (last 5)                            │
│    • Top 10 relevant memories                                   │
│    • Total XP, level, streak                                    │
│                                                                  │
│  ➡️  AI sees EVERYTHING in your app                             │
│  ➡️  Persistent conversation context across sessions            │
│  ➡️  Can reference past conversations and completed quests      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      BOND SYSTEM FLOW                            │
└─────────────────────────────────────────────────────────────────┘

User sends message
    ↓
incrementBondOnMessage() called
    ↓
affection += 1
trust += 1
    ↓
Check bond level thresholds
    ↓
If affection >= 20 and bondLevel == 1:
    bondLevel = 2
    bondTitle = 'Familiar'
    unlockedFeatures.push('Daily Emotional Sync')
    ↓
If affection >= 40 and bondLevel == 2:
    bondLevel = 3
    bondTitle = 'Attuned'
    unlockedFeatures.push('Bond Memory Recall')
    ↓
... continues to level 6 (100 affection)
    ↓
Update personalityState based on affection:
    < 20: 'Neutral-Calm'
    < 40: 'Supportive'
    < 60: 'Warm-Protective'
    < 80: 'Bonded'
    >= 80: 'Soul-Link Evolution Stage 1'
    ↓
Save to AsyncStorage

┌─────────────────────────────────────────────────────────────────┐
│                    MEMORY SYSTEM FLOW                            │
└─────────────────────────────────────────────────────────────────┘

User interacts with app
    ↓
Important info identified (goals, preferences, patterns)
    ↓
addMemoryItem() called
    {
      type: 'preference',
      content: 'User prefers morning workouts',
      importanceScore: 3,
      sourceTags: ['health', 'routine']
    }
    ↓
Saved to state.memoryItems[]
    ↓
Persisted to AsyncStorage
    ↓
On next conversation:
    getRelevantMemories() called
        ↓
        Sort by importanceScore (desc), then updatedAt (desc)
        ↓
        Return top 10
    ↓
Inject into AI system prompt
    ↓
AI uses memories to maintain context:
    "Last time you mentioned preferring morning workouts..."

┌─────────────────────────────────────────────────────────────────┐
│                  OMNISYNC BACKUP FLOW                            │
└─────────────────────────────────────────────────────────────────┘

User taps /omnisync button (Navi tab)
    ↓
omnisync() method called
    ↓
Create snapshot:
    {
      userIdentity: state.user.name,
      questCount: state.quests.length,
      skillCount: state.skills.length,
      memoryCount: state.memoryItems.length,
      vaultCount: state.vault.length,
      chatCount: total messages,
      bondLevel: current bond level
    }
    ↓
Save full state to @mavis_lite_state (main key)
    ↓
Create backup:
    @mavis_lite_state_backup_{timestamp} → full state copy
    ↓
Get all backup keys
    ↓
If > 3 backups exist:
    Delete oldest backups, keep last 3
    ↓
Return success result with snapshot
    ↓
Show alert to user with summary

┌─────────────────────────────────────────────────────────────────┐
│                    DATA VISIBILITY MAP                           │
└─────────────────────────────────────────────────────────────────┘

Navi.EXE AI Can See:
✅ User profile (name, timezone, focus rhythm)
✅ Character class (MBTI, archetype, level, XP, rank, traits)
✅ ALL goals (title, category, progress %, status, metrics, descriptions)
✅ ALL skills (name, level, XP, tags, notes, sub-skills)
✅ ALL quests (pending, active, completed, declined with full details)
✅ Recent journal entries (last 5 from vault)
✅ Total XP and player level
✅ Top 10 memories by importance
✅ Full conversation history (all messages)
✅ Bond level and personality state
✅ Interaction count

Navi.EXE Can Modify (via user interaction):
✅ Create new quests
✅ Suggest skill progression
✅ Save memories during conversations
✅ Increment bond metrics on each message

User Has Control Over:
✅ Accept/decline quests
✅ Complete quest milestones
✅ Add/edit skills manually
✅ Clear chat history
✅ Clear memory
✅ Toggle memory on/off
✅ Customize Navi (personality, skin, mode)
✅ Trigger omnisync backups

┌─────────────────────────────────────────────────────────────────┐
│                   TECH STACK SUMMARY                             │
└─────────────────────────────────────────────────────────────────┘

📱 Framework: React Native (Expo SDK 54)
📂 Routing: Expo Router (file-based)
💾 Storage: AsyncStorage (@react-native-async-storage)
🎨 UI: StyleSheet (native styling)
🤖 AI: @rork-ai/toolkit-sdk (useRorkAgent)
📝 State: React Context + @nkzw/create-context-hook
🔄 Queries: @tanstack/react-query
🎯 Icons: lucide-react-native
📊 Types: Full TypeScript (strict mode)

┌─────────────────────────────────────────────────────────────────┐
│                  KEY FILE LOCATIONS                              │
└─────────────────────────────────────────────────────────────────┘

📁 Contexts:
  • contexts/AppContext.tsx        - Main state management
  • contexts/NaviAPIContext.tsx    - Database API layer (NEW!)

📁 Types:
  • types/index.ts                 - All TypeScript types

📁 Tabs:
  • app/(tabs)/navi.tsx            - Navi profile & bond status
  • app/(tabs)/mavis.tsx           - AI chat interface
  • app/(tabs)/character.tsx       - Character class & skills
  • app/(tabs)/quests.tsx          - Quest management
  • app/(tabs)/skills.tsx          - Skill tree
  • app/(tabs)/vault.tsx           - Journal entries
  • app/(tabs)/stats.tsx           - Performance metrics
  • app/(tabs)/settings.tsx        - App settings

📁 Documentation:
  • MAVIS_LITE_V3.5_INSTALL_COMPLETE.md  - Full installation docs
  • QUICK_API_REFERENCE.md               - Developer quick reference
  • INSTALLATION_SUMMARY.md              - Executive summary

┌─────────────────────────────────────────────────────────────────┐
│               🎉 MAVIS-LITE v3.5 INSTALLED                      │
│                                                                  │
│  Status: ✅ FULLY OPERATIONAL                                   │
│  Date: 2025-12-09                                               │
│  Owner: Calvin Johnathon Watkins                                │
│                                                                  │
│  Features:                                                       │
│    ✅ Complete Database API                                     │
│    ✅ Persistent Memory Engine                                  │
│    ✅ Bond Progression System                                   │
│    ✅ Omnisync Backup                                           │
│    ✅ Full UI Integration                                       │
│                                                                  │
│  Your Navi.EXE companion is ready! 🚀                           │
└─────────────────────────────────────────────────────────────────┘
```
