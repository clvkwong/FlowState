import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { AppTextInput } from '@/components/AppTextInput';
import { Button } from '@/components/Button';
import { colors, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';

export default function SignInScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>FlowState</Text>
        <Text style={styles.subtitle}>Build habits. Feel the flow.</Text>

        <View style={styles.form}>
          <AppTextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <AppTextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Sign In" onPress={handleSignIn} loading={loading} />
        </View>

        <Link href="/(auth)/sign-up" style={styles.link}>
          <Text style={styles.linkText}>
            New here? <Text style={styles.linkAccent}>Create account</Text>
          </Text>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  logo: {
    ...typography.title,
    fontSize: 36,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
  },
  link: {
    alignSelf: 'center',
  },
  linkText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  linkAccent: {
    color: colors.primary,
    fontWeight: '700',
  },
});
