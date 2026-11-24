import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { ReorderHabitRow } from "@/components/ReorderHabitRow";
import {
  colors,
  getTimeOfDayAccent,
  spacing,
  typography,
} from "@/constants/theme";
import { useHabitStore } from "@/stores/habitStore";
import type { Habit, TimeOfDay } from "@/types/habit";
import { compareHabits } from "@/utils/habitLogic";
import {
  TIME_OF_DAY_LABELS,
  TIME_OF_DAY_ORDER,
  getTimeOfDay,
} from "@/utils/schedule";

type Groups = Record<TimeOfDay, string[]>;

/**
 * Habits only ever appear alongside others from the same time of day, so
 * reordering happens within each section. Saving concatenates the sections
 * in home-screen order into one global sequence.
 */
function groupIds(habits: Habit[]): Groups {
  const groups: Groups = { morning: [], afternoon: [], evening: [], anytime: [] };
  for (const habit of [...habits].sort(compareHabits)) {
    groups[getTimeOfDay(habit)].push(habit.id);
  }
  return groups;
}

export default function ReorderHabitsScreen() {
  const router = useRouter();
  const habits = useHabitStore((s) => s.habits);
  const reorderHabits = useHabitStore((s) => s.reorderHabits);
  const [groups, setGroups] = useState<Groups>(() => groupIds(habits));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const byId = new Map(habits.map((h) => [h.id, h]));

  const move = (timeOfDay: TimeOfDay, from: number, to: number) => {
    setGroups((prev) => {
      const ids = [...prev[timeOfDay]];
      if (to < 0 || to >= ids.length) return prev;
      [ids[from], ids[to]] = [ids[to], ids[from]];
      return { ...prev, [timeOfDay]: ids };
    });
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const ordered = TIME_OF_DAY_ORDER.flatMap((t) => groups[t]).filter(
        (id) => byId.has(id),
      );
      await reorderHabits(ordered);
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert("Couldn't save order", "Check your connection and try again.");
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Set the order habits appear in each section. Finished habits still
          drop below unfinished ones.
        </Text>
        {TIME_OF_DAY_ORDER.map((timeOfDay) => {
          const ids = groups[timeOfDay].filter((id) => byId.has(id));
          if (ids.length === 0) return null;
          return (
            <View key={timeOfDay} style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: getTimeOfDayAccent(timeOfDay) },
                ]}
                accessibilityRole="header"
              >
                {TIME_OF_DAY_LABELS[timeOfDay]}
              </Text>
              {ids.map((id, index) => (
                <ReorderHabitRow
                  key={id}
                  habit={byId.get(id)!}
                  position={index + 1}
                  isFirst={index === 0}
                  isLast={index === ids.length - 1}
                  onMoveUp={() => move(timeOfDay, index, index - 1)}
                  onMoveDown={() => move(timeOfDay, index, index + 1)}
                />
              ))}
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title="Save order"
          onPress={save}
          disabled={!dirty}
          loading={saving}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    gap: spacing.lg,
  },
  intro: {
    ...typography.body,
    fontSize: 15,
    color: colors.textSecondary,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
});
