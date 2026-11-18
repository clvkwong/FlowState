import { useCallback, useState } from "react";
import { Alert } from "react-native";

import { useAuthStore } from "@/stores/authStore";
import { useHabitStore } from "@/stores/habitStore";
import { useLogStore } from "@/stores/logStore";
import type { Habit } from "@/types/habit";

/**
 * Confirm-then-delete for a habit and all of its logs. Shared by the habit
 * detail screen and the home screen's long-press / swipe actions.
 */
export function useDeleteHabit() {
  const user = useAuthStore((s) => s.user);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);
  const deleteLogsForHabitRemote = useLogStore(
    (s) => s.deleteLogsForHabitRemote,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const confirmDelete = useCallback(
    (habit: Pick<Habit, "id" | "name">, onDeleted?: () => void) => {
      Alert.alert(
        `Delete "${habit.name}"?`,
        "This removes the habit and all of its history. This can't be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              if (!user) return;
              setDeletingId(habit.id);
              try {
                await deleteHabit(user.uid, habit.id);
                await deleteLogsForHabitRemote(user.uid, habit.id);
                onDeleted?.();
              } catch (e) {
                Alert.alert(
                  "Delete failed",
                  e instanceof Error ? e.message : "Something went wrong",
                );
              } finally {
                setDeletingId(null);
              }
            },
          },
        ],
      );
    },
    [user, deleteHabit, deleteLogsForHabitRemote],
  );

  return { confirmDelete, deletingId };
}
