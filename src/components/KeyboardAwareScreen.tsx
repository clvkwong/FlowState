import { StyleSheet } from 'react-native';
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
} from 'react-native-keyboard-controller';
import { colors, spacing } from '@/constants/theme';

/**
 * KeyboardAwareScrollView positions the text caret — not the input's bottom
 * edge — `bottomOffset` above the keyboard, and measures the caret without the
 * input's padding/border. For AppTextInput that leaves the field ~30pt lower
 * than intended, so we add that distance back.
 */
const CARET_TO_INPUT_BOTTOM = 32;

interface KeyboardAwareScreenProps extends KeyboardAwareScrollViewProps {
  /**
   * Extra height below the focused input to keep above the keyboard,
   * e.g. the gap + height of a submit button directly under the last field.
   */
  keepVisibleBelow?: number;
}

/**
 * Scroll container for any screen that contains text inputs. Keeps the focused
 * input above the keyboard on both platforms — use this instead of a plain
 * ScrollView / KeyboardAvoidingView. Requires KeyboardProvider (root layout).
 */
export function KeyboardAwareScreen({
  style,
  contentContainerStyle,
  keepVisibleBelow = 0,
  ...props
}: KeyboardAwareScreenProps) {
  return (
    <KeyboardAwareScrollView
      bottomOffset={CARET_TO_INPUT_BOTTOM + keepVisibleBelow + spacing.lg}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={[styles.scroll, style]}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
  },
});
