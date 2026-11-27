import type { ReactNode } from "react";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";

import { SwipeActionsRow } from "@/components/SwipeActionsRow";
import type { Habit } from "@/types/habit";

interface SwipeableHabitRowProps {
  habit: Habit;
  children: ReactNode;
  onView: (habit: Habit) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
  /** Called when this row starts opening, so the list can close any other. */
  onOpen?: (row: SwipeableMethods) => void;
}

/** Swipe a habit card left to reveal View / Edit / Delete. */
export function SwipeableHabitRow({
  habit,
  children,
  onView,
  onEdit,
  onDelete,
  onOpen,
}: SwipeableHabitRowProps) {
  return (
    <SwipeActionsRow
      itemLabel={habit.name}
      onView={() => onView(habit)}
      onEdit={() => onEdit(habit)}
      onDelete={() => onDelete(habit)}
      onOpen={onOpen}
    >
      {children}
    </SwipeActionsRow>
  );
}
