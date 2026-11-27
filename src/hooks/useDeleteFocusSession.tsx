import { useCallback, useMemo, useState, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { borderRadius, colors, spacing } from "@/constants/theme";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useFocusStore } from "@/stores/focusStore";
import type { FocusSession } from "@/types/focus";
import { formatTime, todayString } from "@/utils/date";
import {
  focusDayLabel,
  formatFocusMinutes,
  formatFocusTotal,
  getFocusDeleteImpact,
  getFocusSessionDate,
} from "@/utils/focus";

function days(n: number): string {
  return `${n} ${n === 1 ? "day" : "days"}`;
}

/**
 * Confirm-then-delete for a past focus session. The dialog previews how the
 * focus streak and 7-day total change. Render `dialog` once in the screen.
 */
export function useDeleteFocusSession() {
  const sessions = useFocusStore((s) => s.sessions);
  const deleteSession = useFocusStore((s) => s.deleteSession);
  const [pending, setPending] = useState<{
    session: FocusSession;
    onDeleted?: () => void;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const requestDelete = useCallback(
    (session: FocusSession, onDeleted?: () => void) => {
      setError("");
      setPending({ session, onDeleted });
    },
    [],
  );

  const today = todayString();
  const impact = useMemo(
    () => (pending ? getFocusDeleteImpact(sessions, pending.session.id) : null),
    [pending, sessions],
  );

  const confirm = async () => {
    if (!pending) return;
    setDeleting(true);
    setError("");
    try {
      await deleteSession(pending.session.id);
      const done = pending.onDeleted;
      setPending(null);
      done?.();
    } catch {
      setError("Couldn't delete this session. Check your connection.");
    } finally {
      setDeleting(false);
    }
  };

  const session = pending?.session;
  const dialog: ReactNode = (
    <ConfirmDialog
      visible={pending !== null}
      icon="trash-outline"
      tone="danger"
      title="Delete session?"
      message={
        session
          ? `"${session.task}", ${formatFocusMinutes(session.actualDurationSeconds)} · ${focusDayLabel(getFocusSessionDate(session), today)} at ${formatTime(session.startedAt)}. This can't be undone.`
          : ""
      }
      cancelLabel="Keep it"
      confirmLabel={deleting ? "Deleting…" : "Delete"}
      confirmDisabled={deleting}
      onCancel={() => {
        if (!deleting) setPending(null);
      }}
      onConfirm={() => void confirm()}
    >
      {impact ? (
        <View style={styles.impact}>
          {impact.weekBefore !== null && impact.weekAfter !== null ? (
            <View style={styles.row}>
              <Text style={styles.label}>Last 7 days</Text>
              <Text style={styles.value}>
                <Text style={styles.before}>
                  {formatFocusTotal(impact.weekBefore)}
                </Text>{" "}
                → {formatFocusTotal(impact.weekAfter)}
              </Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.label}>Focus streak</Text>
            {impact.streakAfter === impact.streakBefore ? (
              <Text style={[styles.value, styles.kept]}>
                Stays at {days(impact.streakBefore)}
              </Text>
            ) : (
              <Text style={styles.value}>
                <Text style={styles.before}>{impact.streakBefore}</Text> →{" "}
                <Text style={styles.lost}>{days(impact.streakAfter)}</Text>
              </Text>
            )}
          </View>
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ConfirmDialog>
  );

  return { requestDelete, dialog, deleting };
}

const styles = StyleSheet.create({
  impact: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  value: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  before: {
    color: colors.textSecondary,
  },
  kept: {
    color: colors.focus,
  },
  lost: {
    color: colors.danger,
  },
  error: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.danger,
  },
});
