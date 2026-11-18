import { Tabs } from "expo-router";
import Ionicons from "@react-native-vector-icons/ionicons";

import { FloatingTabBar } from "@/components/FloatingTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Habits",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          title: "Focus",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="timer-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
