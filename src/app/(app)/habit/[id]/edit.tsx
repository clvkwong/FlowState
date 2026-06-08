import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { HabitForm } from '@/components/HabitForm';
import { colors, spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useHabitStore } from '@/stores/habitStore';
import { useLogStore } from '@/stores/logStore';
import type { CreateHabitInput } from '@/types/habit';

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
    await updateHabit(habit.id, {
      name: input.name,
      target: input.target,
      tasks: input.tasks,
    });
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
