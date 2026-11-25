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

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 280;
const STROKE = 20;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface FocusTimerRingProps {
  remainingSeconds: number;
  plannedSeconds: number;
  paused: boolean;
}

/** Focus-amber ring that empties as the session's time runs down. */
export function FocusTimerRing({
  remainingSeconds,
  plannedSeconds,
  paused,
}: FocusTimerRingProps) {
  const ratio = plannedSeconds > 0 ? remainingSeconds / plannedSeconds : 0;
  const fill = useSharedValue(ratio);

  useEffect(() => {
    fill.value = withTiming(ratio, { duration: 250 });
  }, [fill, ratio]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - fill.value),
  }));

  const display = formatDuration(remainingSeconds);
  const planned = formatDuration(plannedSeconds);

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="timer"
      accessibilityLabel={`${display} left of ${planned}${paused ? ", paused" : ""}`}
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
          stroke={colors.focus}
          strokeOpacity={paused ? 0.45 : 1}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
          animatedProps={animatedProps}
        />
      </Svg>
      <Text style={[styles.time, paused && styles.timePaused]}>{display}</Text>
      <Text style={styles.caption}>
        {paused ? "PAUSED" : `OF ${planned}`}
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
    fontSize: 72,
    fontWeight: "900",
    letterSpacing: -2,
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  timePaused: {
    color: colors.textSecondary,
  },
  caption: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: colors.focus,
  },
});
