import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Habit, HabitLog, Routine, UserSettings, SyncQueueItem } from '../types';
import { DEFAULT_SETTINGS, INITIAL_HABITS, INITIAL_ROUTINES, generateInitialLogs } from './sampleData';

const DB_NAME = 'init_habits_db';
const DB_VERSION = 2;

interface HabitDB extends DBSchema {
  habits: {
    key: string;
    value: Habit;
    indexes: { 'by-archived': number };
  };
  logs: {
    key: string;
    value: HabitLog;
    indexes: { 'by-habit': string; 'by-date': string; 'by-habit-date': [string, string] };
  };
  routines: {
    key: string;
    value: Routine;
  };
  settings: {
    key: string;
    value: UserSettings;
  };
  sync_queue: {
    key: string;
    value: SyncQueueItem;
    indexes: { 'by-timestamp': number };
  };
}

let dbPromise: Promise<IDBPDatabase<HabitDB>> | null = null;

async function getDB(): Promise<IDBPDatabase<HabitDB>> {
  if (!dbPromise) {
    dbPromise = openDB<HabitDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Habits store
        if (!db.objectStoreNames.contains('habits')) {
          const habitStore = db.createObjectStore('habits', { keyPath: 'id' });
          habitStore.createIndex('by-archived', 'archived');
        }
        // Logs store
        if (!db.objectStoreNames.contains('logs')) {
          const logStore = db.createObjectStore('logs', { keyPath: 'id' });
          logStore.createIndex('by-habit', 'habit_id');
          logStore.createIndex('by-date', 'date');
          logStore.createIndex('by-habit-date', ['habit_id', 'date']);
        }
        // Routines store
        if (!db.objectStoreNames.contains('routines')) {
          db.createObjectStore('routines', { keyPath: 'id' });
        }
        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        // Sync queue store
        if (!db.objectStoreNames.contains('sync_queue')) {
          const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          queueStore.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
}

export const StorageEngine = {
  // Initialize and seed if empty
  async init(): Promise<void> {
    try {
      const db = await getDB();
      const count = await db.count('habits');
      if (count === 0) {
        // Seed default habits
        const tx = db.transaction(['habits', 'routines', 'logs', 'settings'], 'readwrite');
        for (const habit of INITIAL_HABITS) {
          await tx.objectStore('habits').put(habit);
        }
        for (const routine of INITIAL_ROUTINES) {
          await tx.objectStore('routines').put(routine);
        }
        const sampleLogs = generateInitialLogs();
        for (const log of sampleLogs) {
          await tx.objectStore('logs').put(log);
        }
        await tx.objectStore('settings').put(DEFAULT_SETTINGS, 'user_settings');
        await tx.done;
      }
    } catch (err) {
      console.warn('IndexedDB initialization error, fallback may be active:', err);
    }
  },

  // Habits
  async getHabits(): Promise<Habit[]> {
    const db = await getDB();
    const habits = await db.getAll('habits');
    return habits.sort((a, b) => a.order_index - b.order_index);
  },

  async saveHabit(habit: Habit): Promise<void> {
    const db = await getDB();
    await db.put('habits', habit);
  },

  async deleteHabit(id: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['habits', 'logs'], 'readwrite');
    await tx.objectStore('habits').delete(id);
    // Delete associated logs
    const logIndex = tx.objectStore('logs').index('by-habit');
    let cursor = await logIndex.openCursor(IDBKeyRange.only(id));
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  },

  // Logs
  async getAllLogs(): Promise<HabitLog[]> {
    const db = await getDB();
    return await db.getAll('logs');
  },

  async getLogsByDate(dateStr: string): Promise<HabitLog[]> {
    const db = await getDB();
    const index = db.transaction('logs').store.index('by-date');
    return await index.getAll(IDBKeyRange.only(dateStr));
  },

  async getLog(habitId: string, dateStr: string): Promise<HabitLog | undefined> {
    const db = await getDB();
    const index = db.transaction('logs').store.index('by-habit-date');
    return await index.get([habitId, dateStr]);
  },

  async saveLog(log: HabitLog): Promise<void> {
    const db = await getDB();
    await db.put('logs', log);
  },

  async deleteLog(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('logs', id);
  },

  // Routines
  async getRoutines(): Promise<Routine[]> {
    const db = await getDB();
    return await db.getAll('routines');
  },

  async saveRoutine(routine: Routine): Promise<void> {
    const db = await getDB();
    await db.put('routines', routine);
  },

  async deleteRoutine(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('routines', id);
  },

  // Settings
  async getSettings(): Promise<UserSettings> {
    try {
      const db = await getDB();
      const settings = await db.get('settings', 'user_settings');
      return settings || DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: UserSettings): Promise<void> {
    const db = await getDB();
    await db.put('settings', settings, 'user_settings');
  },

  // Reset to default sample state
  async resetAll(): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['habits', 'logs', 'routines', 'settings'], 'readwrite');
    await tx.objectStore('habits').clear();
    await tx.objectStore('logs').clear();
    await tx.objectStore('routines').clear();
    await tx.objectStore('settings').clear();

    for (const habit of INITIAL_HABITS) {
      await tx.objectStore('habits').put(habit);
    }
    for (const routine of INITIAL_ROUTINES) {
      await tx.objectStore('routines').put(routine);
    }
    const sampleLogs = generateInitialLogs();
    for (const log of sampleLogs) {
      await tx.objectStore('logs').put(log);
    }
    await tx.objectStore('settings').put(DEFAULT_SETTINGS, 'user_settings');
    await tx.done;
  },

  // Complete data export
  async exportFullData(): Promise<{
    version: number;
    exportDate: string;
    habits: Habit[];
    logs: HabitLog[];
    routines: Routine[];
    settings: UserSettings;
  }> {
    const habits = await this.getHabits();
    const logs = await this.getAllLogs();
    const routines = await this.getRoutines();
    const settings = await this.getSettings();

    return {
      version: 1,
      exportDate: new Date().toISOString(),
      habits,
      logs,
      routines,
      settings,
    };
  },

  // Import
  async importFullData(data: {
    habits?: Habit[];
    logs?: HabitLog[];
    routines?: Routine[];
    settings?: UserSettings;
  }): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['habits', 'logs', 'routines', 'settings'], 'readwrite');

    if (Array.isArray(data.habits)) {
      await tx.objectStore('habits').clear();
      for (const h of data.habits) {
        await tx.objectStore('habits').put(h);
      }
    }
    if (Array.isArray(data.logs)) {
      await tx.objectStore('logs').clear();
      for (const l of data.logs) {
        await tx.objectStore('logs').put(l);
      }
    }
    if (Array.isArray(data.routines)) {
      await tx.objectStore('routines').clear();
      for (const r of data.routines) {
        await tx.objectStore('routines').put(r);
      }
    }
    if (data.settings) {
      await tx.objectStore('settings').put(data.settings, 'user_settings');
    }
    await tx.done;
  },

  // Sync Queue
  async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    const db = await getDB();
    await db.put('sync_queue', item);
  },

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await getDB();
    const items = await db.getAll('sync_queue');
    return items.sort((a, b) => a.timestamp - b.timestamp);
  },

  async removeSyncQueueItem(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('sync_queue', id);
  },

  async clearSyncQueue(): Promise<void> {
    const db = await getDB();
    await db.clear('sync_queue');
  },
};
