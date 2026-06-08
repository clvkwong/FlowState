import type { HabitType } from '@/types/habit';

export const colors = {
  primary: '#6C47FF',
  check: '#A8E63D',
  count: '#00D4FF',
  routine: '#6C47FF',
  background: '#1a1a2e',
  surface: '#242438',
  textPrimary: '#F5F5FF',
  textSecondary: '#9090B0',
  danger: '#FF4D6D',
} as const;

export const borderRadius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const typography = {
  title: { fontSize: 28, fontWeight: '800' as const },
  heading: { fontSize: 22, fontWeight: '700' as const },
  body: { fontSize: 16, fontWeight: '500' as const },
  label: { fontSize: 14, fontWeight: '600' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
};

export function getHabitAccent(type: HabitType): string {
  switch (type) {
    case 'check':
      return colors.check;
    case 'count':
      return colors.count;
    case 'routine':
      return colors.routine;
  }
}

export function withOpacity(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
