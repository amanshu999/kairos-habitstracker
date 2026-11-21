import { StorageEngine } from './storage';
import { getSupabaseClient, getCurrentUser } from './supabase';
import { SyncQueueItem, SyncTable, SyncAction, SyncState, Habit, HabitLog, Routine } from '../types';

type SyncListener = (state: SyncState, pendingCount: number) => void;

class SyncEngineClass {
  private state: SyncState = 'idle';
  private listeners: Set<SyncListener> = new Set();
  private isProcessing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.flush();
      });
      window.addEventListener('offline', () => {
        this.setState('offline');
      });
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.state, 0);
    return () => this.listeners.delete(listener);
  }

  private async setState(newState: SyncState) {
    this.state = newState;
    let count = 0;
    try {
      const queue = await StorageEngine.getSyncQueue();
      count = queue.length;
    } catch {
      // ignore
    }
    this.listeners.forEach((fn) => fn(this.state, count));
  }

  /**
   * Queue a mutation for sync and attempt immediate flush if online
   */
  public async enqueue(table: SyncTable, action: SyncAction, data: any): Promise<void> {
    const item: SyncQueueItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      table,
      action,
      data,
      timestamp: Date.now(),
    };

    await StorageEngine.addToSyncQueue(item);

    if (navigator.onLine) {
      await this.flush();
    } else {
      await this.setState('offline');
    }
  }

  /**
   * Flush all pending queue items to Supabase
   */
  public async flush(): Promise<void> {
    if (this.isProcessing) return;
    if (!navigator.onLine) {
      await this.setState('offline');
      return;
    }

    const client = getSupabaseClient();
    const user = await getCurrentUser();
    if (!client || !user) {
      await this.setState('idle');
      return;
    }

    this.isProcessing = true;
    await this.setState('syncing');

    try {
      const queue = await StorageEngine.getSyncQueue();
      if (queue.length === 0) {
        await this.setState('synced');
        this.isProcessing = false;
        return;
      }

      for (const item of queue) {
        try {
          if (item.action === 'upsert') {
            const payload = {
              ...item.data,
              user_id: user.id,
            };
            const { error } = await client.from(item.table).upsert(payload);
            if (error) {
              console.warn(`Sync upsert failed for ${item.table}:`, error.message);
              // Break on network/permission error to preserve ordering
              break;
            }
          } else if (item.action === 'delete') {
            const { error } = await client
              .from(item.table)
              .delete()
              .eq('id', item.data.id)
              .eq('user_id', user.id);
            if (error) {
              console.warn(`Sync delete failed for ${item.table}:`, error.message);
              break;
            }
          }

          // Remove item once successfully acknowledged
          await StorageEngine.removeSyncQueueItem(item.id);
        } catch (itemErr) {
          console.warn('Queue item processing error:', itemErr);
          break;
        }
      }

      const remaining = await StorageEngine.getSyncQueue();
      await this.setState(remaining.length === 0 ? 'synced' : 'error');
    } catch (err) {
      console.error('Sync flush error:', err);
      await this.setState('error');
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Two-Way Reconciliation: Pull remote updates from Supabase and merge locally
   */
  public async pullRemoteData(): Promise<{
    habits: Habit[];
    logs: HabitLog[];
    routines: Routine[];
  } | null> {
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    if (!client || !user) return null;

    try {
      await this.setState('syncing');

      const [habitsRes, logsRes, routinesRes] = await Promise.all([
        client.from('habits').select('*').eq('user_id', user.id),
        client.from('habit_logs').select('*').eq('user_id', user.id),
        client.from('routines').select('*').eq('user_id', user.id),
      ]);

      if (habitsRes.error || logsRes.error || routinesRes.error) {
        console.warn('Failed to pull remote records:', habitsRes.error || logsRes.error);
        await this.setState('error');
        return null;
      }

      const remoteHabits: Habit[] = habitsRes.data || [];
      const remoteLogs: HabitLog[] = logsRes.data || [];
      const remoteRoutines: Routine[] = routinesRes.data || [];

      // Local current data
      const localHabits = await StorageEngine.getHabits();
      const localLogs = await StorageEngine.getAllLogs();
      const localRoutines = await StorageEngine.getRoutines();

      // Merge habits (remote + local unique)
      const habitMap = new Map<string, Habit>();
      localHabits.forEach((h) => habitMap.set(h.id, h));
      remoteHabits.forEach((h) => habitMap.set(h.id, h));
      for (const h of habitMap.values()) {
        await StorageEngine.saveHabit(h);
      }

      // Merge routines
      const routineMap = new Map<string, Routine>();
      localRoutines.forEach((r) => routineMap.set(r.id, r));
      remoteRoutines.forEach((r) => routineMap.set(r.id, r));
      for (const r of routineMap.values()) {
        await StorageEngine.saveRoutine(r);
      }

      // Merge logs with conflict resolution: latest updated_at wins
      const logMap = new Map<string, HabitLog>();
      localLogs.forEach((l) => logMap.set(`${l.habit_id}-${l.date}`, l));

      for (const remoteLog of remoteLogs) {
        const key = `${remoteLog.habit_id}-${remoteLog.date}`;
        const localLog = logMap.get(key);

        if (!localLog) {
          logMap.set(key, remoteLog);
          await StorageEngine.saveLog(remoteLog);
        } else {
          // Compare ISO timestamps
          const remoteTime = new Date(remoteLog.updated_at || 0).getTime();
          const localTime = new Date(localLog.updated_at || 0).getTime();

          if (remoteTime >= localTime) {
            logMap.set(key, remoteLog);
            await StorageEngine.saveLog(remoteLog);
          }
        }
      }

      await this.setState('synced');

      return {
        habits: Array.from(habitMap.values()).sort((a, b) => a.order_index - b.order_index),
        logs: Array.from(logMap.values()),
        routines: Array.from(routineMap.values()),
      };
    } catch (err) {
      console.error('Remote pull exception:', err);
      await this.setState('error');
      return null;
    }
  }
}

export const SyncEngine = new SyncEngineClass();
