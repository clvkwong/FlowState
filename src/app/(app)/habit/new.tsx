import { useRouter } from 'expo-router';
import { HabitForm } from '@/components/HabitForm';
import { useAuthStore } from '@/stores/authStore';
import { useHabitStore } from '@/stores/habitStore';
import type { CreateHabitInput } from '@/types/habit';

export default function NewHabitScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const createHabit = useHabitStore((s) => s.createHabit);

  const handleSubmit = async (input: CreateHabitInput) => {
    if (!user) return;
    await createHabit(user.uid, input);
    router.back();
  };

  return <HabitForm onSubmit={handleSubmit} submitLabel="Create Habit" />;
}
