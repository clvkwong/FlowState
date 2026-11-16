import { StyleSheet } from 'react-native';
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
} from 'react-native-keyboard-controller';
import { colors, spacing } from '@/constants/theme';

/**
 * Scroll container for any screen that contains text inputs. Keeps the focused
 * input above the keyboard on both platforms — use this instead of a plain
 * ScrollView / KeyboardAvoidingView. Requires KeyboardProvider (root layout).
 */
export function KeyboardAwareScreen({
  style,
  contentContainerStyle,
  ...props
}: KeyboardAwareScrollViewProps) {
  return (
    <KeyboardAwareScrollView
      bottomOffset={spacing.lg}
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
