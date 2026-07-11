import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="habit/new" options={{ title: 'New Habit', presentation: 'modal' }} />
      <Stack.Screen name="habit/[id]/edit" options={{ title: 'Edit Habit' }} />
      <Stack.Screen
        name="routine/[habitId]"
        options={{ title: '', headerShown: false, presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="focus/[sessionId]"
        options={{ title: '', headerShown: false, presentation: 'fullScreenModal' }}
      />
    </Stack>
  );
}
