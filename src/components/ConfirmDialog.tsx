import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import { borderRadius, colors, spacing, withOpacity } from "@/constants/theme";

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: ComponentProps<typeof Ionicons>["name"];
  /** "danger" styles the confirm button for destructive actions. */
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
  /** Extra content between the message and the buttons. */
  children?: ReactNode;
  /** Disables the confirm button (e.g. while the action runs). */
  confirmDisabled?: boolean;
}

/**
 * Branded confirm dialog: a centred Surface card over a dimmed backdrop.
 * The safe choice (cancel) is the solid primary button; a destructive
 * confirm is the outlined danger button below it.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  icon,
  tone = "primary",
  onConfirm,
  onCancel,
  children,
  confirmDisabled,
}: ConfirmDialogProps) {
  const scale = useRef(new Animated.Value(0.94)).current;
  const accent = tone === "danger" ? colors.danger : colors.primary;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.94);
    Animated.timing(scale, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [visible, scale]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
        />
        <Animated.View
          style={[styles.card, { transform: [{ scale }] }]}
          accessibilityViewIsModal
        >
          {icon ? (
            <View
              style={[styles.icon, { backgroundColor: withOpacity(accent, 0.15) }]}
            >
              <Ionicons name={icon} size={26} color={accent} />
            </View>
          ) : null}
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Text style={styles.message}>{message}</Text>
          {children}

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={confirmDisabled}
              accessibilityRole="button"
              accessibilityState={{ disabled: !!confirmDisabled }}
              style={({ pressed }) => [
                styles.confirm,
                {
                  borderColor: accent,
                  backgroundColor: withOpacity(accent, 0.12),
                },
                pressed && styles.pressed,
                confirmDisabled && styles.disabled,
              ]}
            >
              <Text style={[styles.confirmText, { color: accent }]}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
  backdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(14, 14, 30, 0.78)",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: withOpacity(colors.textPrimary, 0.08),
    padding: spacing.lg,
    gap: 14,
    shadowColor: "#080814",
    shadowOpacity: 0.7,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 24 },
    elevation: 16,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  message: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 23,
    color: colors.textSecondary,
  },
  actions: {
    gap: 10,
    paddingTop: 6,
  },
  cancel: {
    height: 56,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  confirm: {
    height: 56,
    borderRadius: borderRadius.pill,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    fontSize: 17,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
