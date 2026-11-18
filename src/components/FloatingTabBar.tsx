import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import type { Tabs } from "expo-router";

import { borderRadius, colors, spacing, withOpacity } from "@/constants/theme";

type TabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

const ICON_SIZE = 22;
const FADE_HEIGHT = 150;

/**
 * Floating pill tab bar on a raised surface with a light outline and deep
 * shadow; the active tab is a solid primary pill. A fade behind it lets
 * list content darken out instead of colliding with the bar. Drop-in for
 * the Tabs `tabBar` prop.
 */
export function FloatingTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: TabBarProps) {
  return (
    <>
      <View
        style={[styles.fade, { height: FADE_HEIGHT + insets.bottom }]}
        pointerEvents="none"
      >
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="tabFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.background} stopOpacity={0} />
              <Stop
                offset="0.75"
                stopColor={colors.background}
                stopOpacity={1}
              />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#tabFade)" />
        </Svg>
      </View>
      <View
        style={[
          styles.bar,
          { bottom: Math.max(insets.bottom, spacing.md) + 12 },
        ]}
        accessibilityRole="tablist"
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : (options.title ?? route.name);
          const tint = focused ? colors.textPrimary : colors.textOnRaised;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: "tabLongPress", target: route.key });
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              style={({ pressed }) => [
                styles.tab,
                focused && styles.tabActive,
                pressed && styles.pressed,
              ]}
            >
              {options.tabBarIcon?.({ focused, color: tint, size: ICON_SIZE })}
              <Text style={[styles.label, { color: tint }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    position: "absolute",
    left: 36,
    right: 36,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1.5,
    borderColor: withOpacity(colors.textPrimary, 0.14),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    shadowColor: "#0A0A19",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.85,
    shadowRadius: 32,
    elevation: 14,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: borderRadius.pill,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
  },
});
