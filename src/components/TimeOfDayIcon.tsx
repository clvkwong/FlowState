import Ionicons from "@react-native-vector-icons/ionicons";

import { getTimeOfDayAccent } from "@/constants/theme";
import type { TimeOfDay } from "@/types/habit";

const ICONS = {
  morning: "partly-sunny-outline",
  afternoon: "sunny-outline",
  evening: "moon-outline",
  anytime: "infinite-outline",
} as const satisfies Record<TimeOfDay, string>;

interface TimeOfDayIconProps {
  timeOfDay: TimeOfDay;
  size?: number;
  color?: string;
}

export function TimeOfDayIcon({ timeOfDay, size = 18, color }: TimeOfDayIconProps) {
  return (
    <Ionicons
      name={ICONS[timeOfDay]}
      size={size}
      color={color ?? getTimeOfDayAccent(timeOfDay)}
    />
  );
}
