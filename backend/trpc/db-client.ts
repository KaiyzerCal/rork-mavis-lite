const RORK_DB_ENDPOINT = process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT;
const RORK_DB_TOKEN = process.env.EXPO_PUBLIC_RORK_DB_TOKEN;
const RORK_DB_NAMESPACE = process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE;

if (!RORK_DB_ENDPOINT || !RORK_DB_TOKEN || !RORK_DB_NAMESPACE) {
  throw new Error('Missing Rork database configuration');
}

export async function query(sql: string, params?: Record<string, any>): Promise<any[]> {
  try {
    const response = await fetch(`${RORK_DB_ENDPOINT}/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RORK_DB_TOKEN}`,
        'Surreal-NS': RORK_DB_NAMESPACE,
        'Surreal-DB': 'mavis_lite',
      } as HeadersInit,
      body: JSON.stringify({
        query: sql,
        params: params || {},
      }),
    });

    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      let errorText = 'Unknown error';
      try {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorText = errorData.error || errorData.message || JSON.stringify(errorData);
        } else {
          errorText = await response.text();
        }
      } catch {
        errorText = `Failed to parse error response: ${response.statusText}`;
      }
      console.error('[DB] Query failed:', { status: response.status, statusText: response.statusText, body: errorText.substring(0, 500) });
      return [];
    }

    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[DB] Non-JSON response:', text.substring(0, 500));
      return [];
    }

    const data = await response.json();
    
    if (data.error) {
      console.error('[DB] Database error:', data.error);
      return [];
    }
    
    return data.result || data || [];
  } catch (error) {
    console.error('[DB] Query exception:', error, { sql: sql.substring(0, 200), params });
    return [];
  }
}

export const db = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await query(`SELECT * FROM kv_store WHERE key = $key`, { key });
      if (result && result.length > 0) {
        let row = result[0];
        if (row.result && Array.isArray(row.result) && row.result.length > 0) {
          row = row.result[0];
        }
        const value = row.value;
        if (!value) return null;
        return typeof value === 'string' ? JSON.parse(value) : value;
      }
      return null;
    } catch (error) {
      console.error('[DB] Get error:', error);
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await query(`
        INSERT INTO kv_store (key, value, updatedAt) 
        VALUES ($key, $value, $now)
        ON DUPLICATE KEY UPDATE value = $value, updatedAt = $now
      `, { key, value: jsonValue, now: new Date().toISOString() });
    } catch (error) {
      console.error('[DB] Set error:', error);
    }
  },

  async delete(key: string): Promise<void> {
    try {
      await query(`DELETE FROM kv_store WHERE key = $key`, { key });
    } catch (error) {
      console.error('[DB] Delete error:', error);
    }
  },
};

export async function initializeSchema() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updatedAt TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS full_state (
      userId TEXT PRIMARY KEY NOT NULL,
      user TEXT,
      skills TEXT,
      quests TEXT,
      vault TEXT,
      memoryItems TEXT,
      chatHistory TEXT,
      naviProfile TEXT,
      dailyCheckIns TEXT,
      sessionSummaries TEXT,
      journal TEXT,
      leaderboard TEXT,
      settings TEXT,
      stats TEXT,
      sessions TEXT,
      tools TEXT,
      network TEXT,
      archetypeEvolutions TEXT,
      customCouncilMembers TEXT,
      relationshipMemories TEXT,
      naviState TEXT,
      files TEXT,
      generatedImages TEXT,
      ltmBlocks TEXT,
      lastSync TEXT,
      syncVersion INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS chat_threads (
      threadId TEXT PRIMARY KEY NOT NULL,
      userId TEXT NOT NULL,
      messages TEXT,
      messageCount INTEGER DEFAULT 0,
      lastMessageAt TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      threadId TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      full_output TEXT,
      timestamp TEXT NOT NULL,
      metadata TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS memory_items (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      importanceScore INTEGER NOT NULL,
      tags TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS navi_profiles (
      userId TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      personalityPreset TEXT NOT NULL,
      personalityState TEXT NOT NULL,
      currentMode TEXT NOT NULL,
      skinId TEXT NOT NULL,
      level INTEGER NOT NULL,
      xp INTEGER NOT NULL,
      rank TEXT NOT NULL,
      affection INTEGER NOT NULL,
      trust INTEGER NOT NULL,
      loyalty INTEGER NOT NULL,
      bondLevel INTEGER NOT NULL,
      bondTitle TEXT NOT NULL,
      unlockedFeatures TEXT,
      interactionCount INTEGER NOT NULL,
      lastInteraction TEXT NOT NULL,
      avatar TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS app_state (
      userId TEXT PRIMARY KEY,
      quests TEXT,
      skills TEXT,
      vault TEXT,
      dailyCheckIns TEXT,
      lastSync TEXT
    )`,
  ];

  for (const table of tables) {
    try {
      await query(table);
    } catch (error) {
      console.error('Failed to initialize table:', error);
    }
  }
  
  console.log('[DB] Schema initialization complete');
}
