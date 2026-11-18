import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { colors } from "@/constants/theme";
import { formatDuration } from "@/utils/date";
import { getStepTimerState } from "@/utils/routineSteps";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 240;
const STROKE = 18;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ROUTINE_TINT = "#C9BBFF";

interface RoutineTimerRingProps {
  countdownSeconds: number;
  plannedSeconds: number;
}

/** Ring that empties as the step's time runs down; turns red once overtime. */
export function RoutineTimerRing({
  countdownSeconds,
  plannedSeconds,
}: RoutineTimerRingProps) {
  const { remainingRatio, isOvertime, display } = getStepTimerState(
    countdownSeconds,
    plannedSeconds,
  );
  // Overtime shows a full red ring rather than an empty one.
  const fill = useSharedValue(isOvertime ? 1 : remainingRatio);

  useEffect(() => {
    fill.value = withTiming(isOvertime ? 1 : remainingRatio, { duration: 250 });
  }, [fill, isOvertime, remainingRatio]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - fill.value),
  }));

  const accent = isOvertime ? colors.danger : colors.routine;
  const planned = formatDuration(plannedSeconds);

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="timer"
      accessibilityLabel={
        isOvertime
          ? `${formatDuration(-countdownSeconds)} over the planned ${planned}`
          : `${display} left of ${planned}`
      }
    >
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.surface}
          strokeWidth={STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={accent}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
          animatedProps={animatedProps}
        />
      </Svg>
      <Text style={[styles.time, isOvertime && styles.timeOvertime]}>
        {display}
      </Text>
      <Text style={[styles.caption, isOvertime && styles.captionOvertime]}>
        {isOvertime ? `OVER ${planned}` : `LEFT OF ${planned}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  time: {
    fontSize: 64,
    fontWeight: "900",
    letterSpacing: -2,
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  timeOvertime: {
    color: colors.danger,
  },
  caption: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: ROUTINE_TINT,
  },
  captionOvertime: {
    color: colors.danger,
  },
});
