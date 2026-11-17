import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { borderRadius, colors } from "@/constants/theme";

interface RoutineStepProgressProps {
  total: number;
  currentIndex: number;
  /** How much of the current step's planned time has been used, 0–1. */
  currentRatio: number;
}

/** One segment per step: done steps full, the current one filling up. */
export function RoutineStepProgress({
  total,
  currentIndex,
  currentRatio,
}: RoutineStepProgressProps) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${currentIndex + 1} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={styles.segment}>
          {i < currentIndex ? <View style={styles.fillDone} /> : null}
          {i === currentIndex ? <CurrentFill ratio={currentRatio} /> : null}
        </View>
      ))}
    </View>
  );
}

function CurrentFill({ ratio }: { ratio: number }) {
  const width = useSharedValue(ratio);

  useEffect(() => {
    width.value = withTiming(ratio, { duration: 250 });
  }, [ratio, width]);

  const style = useAnimatedStyle(() => ({
    width: `${Math.min(Math.max(width.value, 0), 1) * 100}%`,
  }));

  return <Animated.View style={[styles.fill, style]} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 6,
  },
  segment: {
    flex: 1,
    height: 8,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  fill: {
    height: 8,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.routine,
  },
  fillDone: {
    flex: 1,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.routine,
  },
});
