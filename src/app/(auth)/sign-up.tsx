import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { AppTextInput } from '@/components/AppTextInput';
import { Button } from '@/components/Button';
import { colors, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';

export default function SignUpScreen() {
  const signUp = useAuthStore((s) => s.signUp);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign up failed');
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
        <Text style={styles.logo}>Join FlowState</Text>
        <Text style={styles.subtitle}>Start building habits today.</Text>

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
          <AppTextInput
            label="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            placeholder="••••••••"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Create Account" onPress={handleSignUp} loading={loading} />
        </View>

        <Link href="/(auth)/sign-in" style={styles.link}>
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkAccent}>Sign in</Text>
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
    fontSize: 32,
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
