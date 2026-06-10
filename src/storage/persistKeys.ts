import { storage } from "@/storage/mmkv";

export function getHabitPersistKey(): string {
  return `flowstate-habits`;
}

export function getLogPersistKey(): string {
  return `flowstate-logs`;
}

export function getRoutineSessionPersistKey(): string {
  return `flowstate-routine-session`;
}
