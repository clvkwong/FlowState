import { type ReactNode, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Ionicons from "@react-native-vector-icons/ionicons";

import { borderRadius, colors } from "@/constants/theme";
import type { Habit } from "@/types/habit";

const ACTION_WIDTH = 76;

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
  const ref = useRef<SwipeableMethods>(null);

  const run = (action: (habit: Habit) => void) => {
    ref.current?.close();
    action(habit);
  };

  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      rightThreshold={ACTION_WIDTH / 2}
      overshootRight={false}
      containerStyle={styles.container}
      onSwipeableWillOpen={() => {
        if (ref.current) onOpen?.(ref.current);
      }}
      renderRightActions={() => (
        <View style={styles.actions}>
          <SwipeAction
            label="View"
            icon="eye-outline"
            background="#3a3a58"
            foreground={colors.textPrimary}
            accessibilityLabel={`View ${habit.name}`}
            onPress={() => run(onView)}
          />
          <SwipeAction
            label="Edit"
            icon="create-outline"
            background={colors.primary}
            foreground={colors.textPrimary}
            accessibilityLabel={`Edit ${habit.name}`}
            onPress={() => run(onEdit)}
          />
          <SwipeAction
            label="Delete"
            icon="trash-outline"
            background={colors.danger}
            foreground={colors.background}
            accessibilityLabel={`Delete ${habit.name}`}
            onPress={() => run(onDelete)}
          />
        </View>
      )}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

interface SwipeActionProps {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  background: string;
  foreground: string;
  accessibilityLabel: string;
  onPress: () => void;
}

function SwipeAction({
  label,
  icon,
  background,
  foreground,
  accessibilityLabel,
  onPress,
}: SwipeActionProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: background },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={22} color={foreground} />
      <Text style={[styles.actionText, { color: foreground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
  },
  actions: {
    flexDirection: "row",
  },
  action: {
    width: ACTION_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  pressed: {
    opacity: 0.8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "800",
  },
});
