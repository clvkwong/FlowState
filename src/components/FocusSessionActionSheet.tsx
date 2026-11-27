import { StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "@/constants/theme";
import { BottomSheet, SheetAction } from "@/components/BottomSheet";
import type { FocusSession } from "@/types/focus";
import { formatTime } from "@/utils/date";
import {
  focusDayLabel,
  formatFocusMinutes,
  getFocusSessionDate,
} from "@/utils/focus";

interface FocusSessionActionSheetProps {
  /** The session the menu is open for; null hides the sheet. */
  session: FocusSession | null;
  today: string;
  onClose: () => void;
  onView: (session: FocusSession) => void;
  onEdit: (session: FocusSession) => void;
  onDelete: (session: FocusSession) => void;
}

/** Long-press menu for a past focus session: View / Edit / Delete. */
export function FocusSessionActionSheet({
  session,
  today,
  onClose,
  onView,
  onEdit,
  onDelete,
}: FocusSessionActionSheetProps) {
  return (
    <BottomSheet
      visible={session !== null}
      onClose={onClose}
      accessibilityLabel={
        session ? `${session.task} options` : "Focus session options"
      }
    >
      {session ? (
        <>
          <View style={styles.summary}>
            <Text style={styles.task} numberOfLines={1}>
              {session.task}
            </Text>
            <Text style={styles.meta}>
              {focusDayLabel(getFocusSessionDate(session), today)} ·{" "}
              {formatTime(session.startedAt)} ·{" "}
              {formatFocusMinutes(session.actualDurationSeconds)} focused
            </Text>
          </View>
          <SheetAction
            label="View details"
            icon="eye-outline"
            variant="secondary"
            onPress={() => onView(session)}
          />
          <SheetAction
            label="Edit session"
            icon="create-outline"
            variant="secondary"
            onPress={() => onEdit(session)}
          />
          <SheetAction
            label="Delete session"
            icon="trash-outline"
            variant="danger"
            onPress={() => onDelete(session)}
          />
          <SheetAction label="Cancel" variant="ghost" onPress={onClose} />
        </>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  summary: {
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
  },
  task: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});
