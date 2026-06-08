import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useHabitStore } from '@/stores/habitStore';
import { useLogStore } from '@/stores/logStore';

export function useStoreHydration(): boolean {
  const user = useAuthStore((s) => s.user);
  const habitHydrated = useHabitStore((s) => s._hasHydrated);
  const logHydrated = useLogStore((s) => s._hasHydrated);
  const restoreFromMMKV = useAuthStore((s) => s.restoreFromMMKV);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!user) {
      setStarted(false);
      return;
    }
    if (started) return;

    setStarted(true);
    restoreFromMMKV(user.uid).catch(console.error);
  }, [user, started, restoreFromMMKV]);

  if (!user) return true;
  return habitHydrated && logHydrated;
}
