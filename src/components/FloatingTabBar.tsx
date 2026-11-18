import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Tabs } from "expo-router";

import { borderRadius, colors, spacing, withOpacity } from "@/constants/theme";

type TabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

const ICON_SIZE = 22;

/**
 * Floating pill tab bar: each tab is an icon + label pill, and the active
 * tab gets a tinted primary pill. Drop-in for the Tabs `tabBar` prop.
 */
export function FloatingTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: TabBarProps) {
  return (
    <View
      style={[styles.bar, { bottom: Math.max(insets.bottom, spacing.md) + 12 }]}
      accessibilityRole="tablist"
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const label =
          typeof options.tabBarLabel === "string"
            ? options.tabBarLabel
            : (options.title ?? route.name);
        const tint = focused ? colors.routineLabel : colors.textSecondary;

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
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 36,
    right: 36,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    shadowColor: colors.background,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 10,
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
    backgroundColor: withOpacity(colors.primary, 0.22),
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
  },
});
