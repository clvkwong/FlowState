import 'react-native-reanimated';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '@/constants/theme';
import { useStoreHydration } from '@/hooks/useStoreHydration';
import * as authService from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

export default function RootLayout() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const setAuthReady = useAuthStore((s) => s.setAuthReady);
  const storesHydrated = useStoreHydration();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        setAuthReady(true);
      }
    });
    return unsubscribe;
  }, [setUser, setLoading, setAuthReady]);

  useEffect(() => {
    if (isLoading) return;
    if (!storesHydrated && user) return;

    const inAuth = segments[0] === '(auth)';

    if (!user && !inAuth) {
      router.replace('/(auth)/sign-in');
    } else if (user && inAuth) {
      router.replace('/(app)');
    }
  }, [user, isLoading, storesHydrated, segments, router]);

  if (isLoading || (user && !storesHydrated)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
