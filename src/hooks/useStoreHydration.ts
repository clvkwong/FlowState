import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useHabitStore } from "@/stores/habitStore";
import { useLogStore } from "@/stores/logStore";

export function useStoreHydration(): boolean {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const habitHydrated = useHabitStore((s) => s._hasHydrated);
  const logHydrated = useLogStore((s) => s._hasHydrated);
  const restoreFromMMKV = useAuthStore((s) => s.restoreFromMMKV);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    if (bootstrapped || isLoading) {
      return;
    }

    setBootstrapped(true);

    if (!user) {
      return;
    }

    restoreFromMMKV().catch(console.error);
  }, [bootstrapped, isLoading, user, restoreFromMMKV]);

  if (!user) return true;
  return habitHydrated && logHydrated;
}
