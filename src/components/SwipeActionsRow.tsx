import { type ReactNode, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Ionicons from "@react-native-vector-icons/ionicons";

import { borderRadius as radii, colors } from "@/constants/theme";

const ACTION_WIDTH = 76;

interface SwipeActionsRowProps {
  /** Spoken name of the item, e.g. the habit name or focus task. */
  itemLabel: string;
  children: ReactNode;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  /** Called when this row starts opening, so the list can close any other. */
  onOpen?: (row: SwipeableMethods) => void;
  /** Corner radius of the card inside, so the revealed actions match it. */
  borderRadius?: number;
}

/** Swipe a card left to reveal View / Edit / Delete. */
export function SwipeActionsRow({
  itemLabel,
  children,
  onView,
  onEdit,
  onDelete,
  onOpen,
  borderRadius = radii.xl,
}: SwipeActionsRowProps) {
  const ref = useRef<SwipeableMethods>(null);

  const run = (action: () => void) => {
    ref.current?.close();
    action();
  };

  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      rightThreshold={ACTION_WIDTH / 2}
      overshootRight={false}
      containerStyle={[styles.container, { borderRadius }]}
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
            accessibilityLabel={`View ${itemLabel}`}
            onPress={() => run(onView)}
          />
          <SwipeAction
            label="Edit"
            icon="create-outline"
            background={colors.primary}
            foreground={colors.textPrimary}
            accessibilityLabel={`Edit ${itemLabel}`}
            onPress={() => run(onEdit)}
          />
          <SwipeAction
            label="Delete"
            icon="trash-outline"
            background={colors.danger}
            foreground={colors.background}
            accessibilityLabel={`Delete ${itemLabel}`}
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
