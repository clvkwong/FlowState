import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';

interface CompletionSummaryProps {
  completed: number;
  total: number;
}

export function CompletionSummary({ completed, total }: CompletionSummaryProps) {
  const ratio = total > 0 ? completed / total : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Today</Text>
        <Text style={styles.count}>
          {completed} <Text style={styles.of}>of</Text> {total}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  count: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  of: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  track: {
    height: 8,
    backgroundColor: 'rgba(108, 71, 255, 0.2)',
    borderRadius: borderRadius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
  },
});
