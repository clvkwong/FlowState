import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { colors } from "@/constants/theme";
import { formatFocusClock } from "@/utils/focus";

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

/**
 * Focus-amber ring that empties as the session's time runs down. Past the
 * planned time it fills back up in check green and counts overtime upward.
 */
export function FocusTimerRing({
  remainingSeconds,
  plannedSeconds,
  paused,
}: FocusTimerRingProps) {
  const overtime = remainingSeconds < 0;
  const ratio = overtime
    ? 1
    : plannedSeconds > 0
      ? remainingSeconds / plannedSeconds
      : 0;
  const fill = useSharedValue(ratio);

  useEffect(() => {
    fill.value = withTiming(ratio, { duration: 250 });
  }, [fill, ratio]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - fill.value),
  }));

  const display = overtime
    ? `+${formatFocusClock(-remainingSeconds)}`
    : formatFocusClock(remainingSeconds);
  const planned = formatFocusClock(plannedSeconds);
  const accent = overtime ? colors.check : colors.focus;

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="timer"
      accessibilityLabel={`${
        overtime
          ? `${formatFocusClock(-remainingSeconds)} over the planned ${planned}`
          : `${display} left of ${planned}`
      }${paused ? ", paused" : ""}`}
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
      <Text
        style={[
          styles.time,
          display.length > 6 && styles.timeLong,
          paused && styles.timePaused,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {display}
      </Text>
      <Text style={[styles.caption, { color: accent }]}>
        {paused ? "PAUSED" : overtime ? `OVER ${planned}` : `OF ${planned}`}
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
    maxWidth: SIZE - STROKE * 2 - 24,
  },
  // H:MM:SS (and +H:MM:SS overtime) needs a smaller face to fit the ring.
  timeLong: {
    fontSize: 54,
    letterSpacing: -1.5,
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
