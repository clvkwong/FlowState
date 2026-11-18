import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { HabitForm } from '@/components/HabitForm';
import { useAuthStore } from '@/stores/authStore';
import { useHabitStore } from '@/stores/habitStore';
import { useRoutineDraftStore } from '@/stores/routineDraftStore';
import type { CreateHabitInput } from '@/types/habit';

export default function NewHabitScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const createHabit = useHabitStore((s) => s.createHabit);
  const draftSteps = useRoutineDraftStore((s) => s.steps);
  const setDraftName = useRoutineDraftStore((s) => s.setName);
  const resetDraft = useRoutineDraftStore((s) => s.reset);

  // Each visit starts with an empty routine draft, discarded on close.
  useEffect(() => {
    resetDraft();
    return resetDraft;
  }, [resetDraft]);

  const handleSubmit = async (input: CreateHabitInput) => {
    if (!user) return;
    if (input.type === 'routine') {
      if (draftSteps.length === 0) throw new Error('Add at least one routine step');
      input = { ...input, tasks: draftSteps };
    }
    await createHabit(user.uid, input);
    router.back();
  };

  return (
    <HabitForm
      onSubmit={handleSubmit}
      onManageSteps={({ name }) => {
        setDraftName(name);
        router.push('/(app)/habit/new-steps');
      }}
      stepCount={draftSteps.length}
      submitLabel="Create Habit"
    />
  );
}
