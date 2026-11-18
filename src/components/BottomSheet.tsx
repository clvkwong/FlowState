import { type ReactNode, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons";

import { borderRadius, colors, spacing, withOpacity } from "@/constants/theme";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  accessibilityLabel: string;
  children: ReactNode;
}

const OFFSCREEN = 480;

/** Modal sheet that slides up from the bottom; tap the backdrop to dismiss. */
export function BottomSheet({
  visible,
  onClose,
  accessibilityLabel,
  children,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(OFFSCREEN)).current;

  useEffect(() => {
    if (!visible) return;
    translateY.setValue(OFFSCREEN);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <Animated.View
          accessibilityViewIsModal
          accessibilityLabel={accessibilityLabel}
          style={[
            styles.sheet,
            {
              marginBottom: Math.max(insets.bottom, spacing.sm),
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.grabber} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * primary: filled CTA · secondary: outlined · danger: outlined red ·
 * dangerText: red label, no outline · ghost: plain label (e.g. Cancel)
 */
type SheetActionVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "dangerText"
  | "ghost";

interface SheetActionProps {
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  variant?: SheetActionVariant;
  onPress: () => void;
  disabled?: boolean;
}

/** Full-width pill button for use inside a BottomSheet. */
export function SheetAction({
  label,
  icon,
  variant = "secondary",
  onPress,
  disabled,
}: SheetActionProps) {
  const tint =
    variant === "danger" || variant === "dangerText"
      ? colors.danger
      : colors.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.action,
        variant === "primary" && styles.actionPrimary,
        variant === "secondary" && styles.actionSecondary,
        variant === "danger" && styles.actionDanger,
        pressed && styles.actionPressed,
        disabled && styles.actionDisabled,
      ]}
    >
      {icon ? <Ionicons name={icon} size={20} color={tint} /> : null}
      <Text style={[styles.actionText, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(12, 12, 28, 0.75)",
  },
  sheet: {
    marginHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 28,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 10,
  },
  grabber: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: borderRadius.pill,
    backgroundColor: withOpacity(colors.textSecondary, 0.4),
    marginBottom: 6,
  },
  action: {
    height: 60,
    borderRadius: borderRadius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  actionPrimary: {
    backgroundColor: colors.primary,
  },
  actionSecondary: {
    borderWidth: 2,
    borderColor: "#34344f",
  },
  actionDanger: {
    borderWidth: 2,
    borderColor: colors.danger,
    backgroundColor: withOpacity(colors.danger, 0.1),
  },
  actionPressed: {
    transform: [{ scale: 0.97 }],
  },
  actionDisabled: {
    opacity: 0.5,
  },
  actionText: {
    fontSize: 17,
    fontWeight: "800",
  },
});
