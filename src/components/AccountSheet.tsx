import { StyleSheet, Text, View } from "react-native";

import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import { BottomSheet, SheetAction } from "@/components/BottomSheet";

interface AccountSheetProps {
  visible: boolean;
  email: string | null | undefined;
  onClose: () => void;
  onSignOut: () => void;
}

export function AccountSheet({
  visible,
  email,
  onClose,
  onSignOut,
}: AccountSheetProps) {
  const initial = email?.trim().charAt(0).toUpperCase() || "?";

  return (
    <BottomSheet visible={visible} onClose={onClose} accessibilityLabel="Account">
      <View style={styles.identity}>
        <View style={styles.avatar} accessibilityElementsHidden>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.identityText}>
          <Text style={styles.label}>SIGNED IN AS</Text>
          <Text style={styles.email} numberOfLines={1} ellipsizeMode="middle">
            {email ?? "Unknown account"}
          </Text>
        </View>
      </View>
      <SheetAction
        label="Sign out"
        icon="log-out-outline"
        variant="danger"
        onPress={onSignOut}
      />
      <SheetAction label="Cancel" variant="ghost" onPress={onClose} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
    paddingBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  identityText: {
    flex: 1,
    gap: 4,
  },
  label: {
    ...typography.caption,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: colors.textSecondary,
  },
  email: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },
});
