import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import { borderRadius, colors, spacing, withOpacity } from "@/constants/theme";
import type { FocusSession } from "@/types/focus";
import { formatFocusMinutes, formatFocusTotal } from "@/utils/focus";

interface FocusCompleteViewProps {
  session: FocusSession;
  streak: number;
  sessionsToday: number;
  weekTotalSeconds: number;
  onDone: () => void;
  onAnotherRound: () => void;
}

/** Reward screen shown after a session finishes. */
export function FocusCompleteView({
  session,
  streak,
  sessionsToday,
  weekTotalSeconds,
  onDone,
  onAnotherRound,
}: FocusCompleteViewProps) {
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, {
      toValue: 1,
      speed: 18,
      bounciness: 12,
      useNativeDriver: true,
    }).start();
  }, [pop]);

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.haloOuter} />
        <View style={styles.haloInner} />
        <Animated.View style={[styles.badge, { transform: [{ scale: pop }] }]}>
          <Ionicons name="checkmark" size={60} color={colors.background} />
        </Animated.View>
      </View>

      <View style={styles.copy}>
        <Text style={styles.title} accessibilityRole="header">
          {session.status === "completed" ? "Focus complete!" : "Finished early!"}
        </Text>
        <Text style={styles.subtitle}>
          <Text style={styles.subtitleStrong}>
            {formatFocusMinutes(session.actualDurationSeconds)}
          </Text>{" "}
          on {session.task}
        </Text>
      </View>

      <View style={styles.stats}>
        <Stat value={String(streak)} label="day streak" color={colors.focus} />
        <Stat
          value={String(sessionsToday)}
          label={sessionsToday === 1 ? "session today" : "sessions today"}
          color={colors.count}
        />
        <Stat
          value={formatFocusTotal(weekTotalSeconds)}
          label="last 7 days"
          color={colors.check}
        />
      </View>

      <View style={styles.spacer} />

      <View style={styles.actions}>
        <Pressable
          onPress={onDone}
          accessibilityRole="button"
          style={({ pressed }) => [styles.done, pressed && styles.pressed]}
        >
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
        <Pressable
          onPress={onAnotherRound}
          accessibilityRole="button"
          style={({ pressed }) => [styles.again, pressed && styles.pressed]}
        >
          <Ionicons name="refresh" size={18} color={colors.textPrimary} />
          <Text style={styles.againText}>Another round</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Stat({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${value} ${label}`}>
      <Text style={[styles.statValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 48,
    gap: 28,
  },
  hero: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  haloOuter: {
    ...StyleSheet.absoluteFill,
    borderRadius: 100,
    backgroundColor: withOpacity(colors.focus, 0.12),
  },
  haloInner: {
    position: "absolute",
    top: 24,
    left: 24,
    right: 24,
    bottom: 24,
    borderRadius: 76,
    backgroundColor: withOpacity(colors.focus, 0.2),
  },
  badge: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.focus,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.focus,
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  copy: {
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -0.6,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
  },
  subtitleStrong: {
    fontWeight: "900",
    color: colors.textPrimary,
  },
  stats: {
    alignSelf: "stretch",
    flexDirection: "row",
    gap: 10,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textAlign: "center",
  },
  spacer: {
    flex: 1,
  },
  actions: {
    alignSelf: "stretch",
    gap: 12,
  },
  done: {
    height: 64,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  doneText: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  again: {
    height: 56,
    borderRadius: borderRadius.pill,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  againText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
