import Ionicons from "@react-native-vector-icons/ionicons";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { borderRadius, colors, spacing, typography, withOpacity } from "@/constants/theme";

// Placeholder: focus mode (one-off timed sessions) is not built yet.
export default function FocusScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Focus</Text>
        <Text style={styles.subtitle}>One-off timed sessions</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.iconBadge}>
          <Ionicons name="timer-outline" size={40} color={colors.primary} />
        </View>
        <Text style={styles.cardTitle}>Coming soon</Text>
        <Text style={styles.cardBody}>
          Lock in on a single task with a countdown timer. Focus mode is on its way.
        </Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>In development</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  card: {
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: withOpacity(colors.primary, 0.35),
    padding: spacing.xl,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: withOpacity(colors.primary, 0.15),
  },
  cardTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  cardBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  pill: {
    borderRadius: borderRadius.pill,
    backgroundColor: withOpacity(colors.primary, 0.2),
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  pillText: {
    ...typography.label,
    color: colors.primary,
  },
});
