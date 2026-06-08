import { storage } from '@/storage/mmkv';

export function getHabitPersistKey(userId: string): string {
  return `flowstate-habits-${userId}`;
}

export function getLogPersistKey(userId: string): string {
  return `flowstate-logs-${userId}`;
}

export function clearUserPersist(userId: string): void {
  storage.remove(getHabitPersistKey(userId));
  storage.remove(getLogPersistKey(userId));
}
