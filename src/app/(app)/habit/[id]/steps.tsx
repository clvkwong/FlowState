import { StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { RoutineStepsEditor } from "@/components/RoutineStepsEditor";
import { colors, spacing, typography } from "@/constants/theme";
import { useHabitStore } from "@/stores/habitStore";
import type { RoutineTask } from "@/types/habit";

const NO_STEPS: RoutineTask[] = [];

export default function RoutineStepsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const habit = useHabitStore((s) => s.habits.find((h) => h.id === id));
  const updateHabit = useHabitStore((s) => s.updateHabit);

  if (!habit || habit.type !== "routine") {
    return (
      <SafeAreaView style={styles.missing}>
        <Text style={styles.missingText}>Routine not found</Text>
        <Button title="Go back" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  return (
    <RoutineStepsEditor
      title={habit.name}
      initialSteps={habit.tasks ?? NO_STEPS}
      onSave={(tasks) => updateHabit(habit.id, { tasks })}
    />
  );
}

const styles = StyleSheet.create({
  missing: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  missingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
