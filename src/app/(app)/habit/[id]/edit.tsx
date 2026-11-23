import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { HabitForm } from '@/components/HabitForm';
import { colors, spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useHabitStore } from '@/stores/habitStore';
import { useLogStore } from '@/stores/logStore';
import type { CreateHabitInput, UpdateHabitInput } from '@/types/habit';
import { normalizeDays } from '@/utils/schedule';

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const habit = useHabitStore((s) => s.habits.find((h) => h.id === id));
  const updateHabit = useHabitStore((s) => s.updateHabit);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);
  const deleteLogsForHabitRemote = useLogStore((s) => s.deleteLogsForHabitRemote);

  if (!habit) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Habit not found</Text>
      </View>
    );
  }

  const handleSubmit = async (input: CreateHabitInput) => {
    // Steps are edited on their own screen; only send fields the form owns so
    // updateHabitLocal never overwrites them with undefined. An empty
    // description is sent as '' so the service clears it.
    const updates: UpdateHabitInput = {
      name: input.name,
      description: input.description ?? '',
    };
    if (input.target !== undefined) updates.target = input.target;
    // Every day is stored as no schedule; null clears an existing one.
    updates.days = normalizeDays(input.days) ?? null;
    if (input.timeOfDay) updates.timeOfDay = input.timeOfDay;
    await updateHabit(habit.id, updates);
    router.back();
  };

  const handleDelete = async () => {
    if (!user) return;
    await deleteHabit(user.uid, habit.id);
    await deleteLogsForHabitRemote(user.uid, habit.id);
    router.replace('/(app)');
  };

  return (
    <HabitForm
      initial={habit}
      lockType
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      onManageSteps={
        habit.type === 'routine'
          ? () => router.push(`/(app)/habit/${habit.id}/steps`)
          : undefined
      }
      submitLabel="Save Changes"
    />
  );
}

const styles = StyleSheet.create({
  missing: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  missingText: {
    color: colors.textSecondary,
  },
});
