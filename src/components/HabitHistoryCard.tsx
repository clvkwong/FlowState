import { useState } from "react";
import {
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import {
  borderRadius,
  colors,
  getHabitAccent,
  spacing,
  typography,
  withOpacity,
} from "@/constants/theme";
import type { Habit } from "@/types/habit";
import type { HabitLog } from "@/types/log";
import {
  formatDuration,
  formatRelativeDay,
  formatShortDate,
  formatTime,
} from "@/utils/date";
import {
  getCountProgress,
  getRoutineTotalActualDuration,
  isHabitCompleted,
} from "@/utils/habitLogic";

interface HabitHistoryCardProps {
  habit: Habit;
  log: HabitLog;
  today: string;
}

export function HabitHistoryCard({ habit, log, today }: HabitHistoryCardProps) {
  const accent = getHabitAccent(habit.type);
  const completed = isHabitCompleted(habit, log);
  const isToday = log.date === today;
  const relativeDay = formatRelativeDay(log.date, today);
  const shortDate = formatShortDate(log.date);
  const title = relativeDay ?? shortDate;
  const dateSubtitle = relativeDay ? shortDate : null;

  const cardStyle = [
    styles.card,
    completed && { backgroundColor: withOpacity(accent, 0.15) },
    isToday && { borderColor: accent },
  ];

  switch (habit.type) {
    case "check":
      return (
        <View style={[cardStyle, styles.row]}>
          <CheckBadge accent={accent} />
          <View style={styles.titles}>
            <Text style={styles.title}>{title}</Text>
            {dateSubtitle ? (
              <Text style={styles.subtitle}>{dateSubtitle}</Text>
            ) : null}
          </View>
          <Text style={styles.time}>{formatTime(log.loggedAt)}</Text>
        </View>
      );
    case "count": {
      const { current, target, ratio } = getCountProgress(habit, log);
      const status = completed
        ? null
        : isToday
          ? "in progress"
          : "target missed";
      const subtitle = [dateSubtitle, status].filter(Boolean).join(" · ");
      return (
        <View style={[cardStyle, styles.countCard]}>
          <View style={styles.row}>
            <View style={styles.countTitles}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <Text style={styles.value}>
              {current}
              <Text style={styles.valueUnit}> / {target}</Text>
            </Text>
            {completed ? <CheckBadge accent={accent} small /> : null}
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { backgroundColor: accent, width: `${ratio * 100}%` },
              ]}
            />
          </View>
        </View>
      );
    }
    case "routine":
      return (
        <RoutineHistoryCard
          habit={habit}
          log={log}
          accent={accent}
          title={title}
          dateSubtitle={dateSubtitle}
          highlighted={isToday}
        />
      );
  }
}

interface RoutineHistoryCardProps {
  habit: Habit;
  log: HabitLog;
  accent: string;
  title: string;
  dateSubtitle: string | null;
  highlighted: boolean;
}

function RoutineHistoryCard({
  habit,
  log,
  accent,
  title,
  dateSubtitle,
  highlighted,
}: RoutineHistoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const completedTasks = log.completedTasks ?? [];
  const stepCount = completedTasks.length;
  const subtitle = [
    dateSubtitle,
    `${stepCount} ${stepCount === 1 ? "step" : "steps"}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const toggle = () => {
    LayoutAnimation.configureNext({
      ...LayoutAnimation.Presets.easeInEaseOut,
      duration: 200,
    });
    setExpanded((prev) => !prev);
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: withOpacity(accent, 0.15) },
        highlighted && { borderColor: accent },
      ]}
    >
      <Pressable
        onPress={toggle}
        disabled={stepCount === 0}
        style={styles.row}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title}, ${subtitle}`}
      >
        <CheckBadge accent={accent} light />
        <View style={styles.titles}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.value}>
          {formatDuration(getRoutineTotalActualDuration(log))}
        </Text>
        {stepCount > 0 ? (
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.textSecondary}
          />
        ) : null}
      </Pressable>

      {expanded ? (
        <View
          style={[styles.steps, { borderTopColor: withOpacity(accent, 0.5) }]}
        >
          {completedTasks.map((done) => {
            const task = habit.tasks?.find((t) => t.id === done.taskId);
            return (
              <View key={done.taskId} style={styles.stepRow}>
                <Text style={styles.stepLabel} numberOfLines={1}>
                  {task?.label ?? "Removed step"}
                </Text>
                <Text style={styles.stepActual}>
                  {formatDuration(done.actualDurationSeconds)}
                  {task ? (
                    <Text style={styles.stepPlanned}>
                      {" "}
                      / {formatDuration(task.durationSeconds)}
                    </Text>
                  ) : null}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function CheckBadge({
  accent,
  small = false,
  light = false,
}: {
  accent: string;
  small?: boolean;
  light?: boolean;
}) {
  const size = small ? 24 : 40;
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, backgroundColor: accent },
      ]}
    >
      <Ionicons
        name="checkmark"
        size={small ? 16 : 24}
        color={light ? colors.textPrimary : colors.background}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: "transparent",
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    gap: 12,
  },
  countCard: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 44,
  },
  titles: {
    flex: 1,
    gap: 3,
  },
  countTitles: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
    minHeight: 0,
  },
  title: {
    ...typography.body,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
    flexShrink: 1,
  },
  time: {
    ...typography.label,
    fontWeight: "700",
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  value: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  valueUnit: {
    ...typography.label,
    color: colors.textSecondary,
  },
  badge: {
    borderRadius: borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  barTrack: {
    height: 8,
    borderRadius: borderRadius.pill,
    backgroundColor: withOpacity(colors.textSecondary, 0.2),
    overflow: "hidden",
  },
  barFill: {
    height: 8,
    borderRadius: borderRadius.pill,
  },
  steps: {
    borderTopWidth: 1,
    paddingTop: 6,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    height: 34,
  },
  stepLabel: {
    ...typography.label,
    fontWeight: "500",
    color: colors.textPrimary,
    flex: 1,
  },
  stepActual: {
    ...typography.label,
    fontWeight: "700",
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  stepPlanned: {
    fontWeight: "500",
    color: colors.textSecondary,
  },
});
