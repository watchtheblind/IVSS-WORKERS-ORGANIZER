import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { container } from '../../container';

export type ThemeName =
  | 'default'
  | 'matcha-cream'
  | 'matcha-deep'
  | 'strawberry-milk'
  | 'warm-oatmeal';

export interface ThemeColors {
  background: string;
  header: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  textStrong: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  accentDark: string;
  accentTint: string;
  success: string;
  successTint: string;
  danger: string;
  dangerDark: string;
  dangerTint: string;
  warning: string;
  warningTint: string;
  purple: string;
  purpleTint: string;
}

export interface ThemeDefinition {
  name: ThemeName;
  label: string;
  dark: boolean;
  colors: ThemeColors;
}

const SETTING_KEY = 'theme';

export const THEMES: ThemeDefinition[] = [
  {
    name: 'default',
    label: 'Default (Oscuro)',
    dark: true,
    colors: {
      background: '#0F172A',
      header: '#0B1120',
      surface: '#1E293B',
      surfaceElevated: '#1E293B',
      border: '#334155',
      textStrong: '#F8FAFC',
      textSecondary: '#CBD5E1',
      textMuted: '#94A3B8',
      textFaint: '#64748B',
      accent: '#38BDF8',
      accentDark: '#0284C7',
      accentTint: 'rgba(56, 189, 248, 0.12)',
      success: '#10B981',
      successTint: 'rgba(16, 185, 129, 0.15)',
      danger: '#EF4444',
      dangerDark: '#DC2626',
      dangerTint: 'rgba(239, 68, 68, 0.12)',
      warning: '#F59E0B',
      warningTint: 'rgba(245, 158, 11, 0.15)',
      purple: '#A78BFA',
      purpleTint: 'rgba(167, 139, 250, 0.12)',
    },
  },
  {
    name: 'matcha-cream',
    label: 'Matcha Cream',
    dark: false,
    colors: {
      background: '#F7F5EC',
      header: '#E7E4D4',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      border: '#E2DECD',
      textStrong: '#24312A',
      textSecondary: '#45564B',
      textMuted: '#7A8B7F',
      textFaint: '#93A296',
      accent: '#6C9A63',
      accentDark: '#55814E',
      accentTint: 'rgba(108, 154, 99, 0.15)',
      success: '#4E9B6D',
      successTint: 'rgba(78, 155, 109, 0.15)',
      danger: '#D64545',
      dangerDark: '#B93A3A',
      dangerTint: 'rgba(214, 69, 69, 0.12)',
      warning: '#C08A2D',
      warningTint: 'rgba(192, 138, 45, 0.15)',
      purple: '#8A6FC0',
      purpleTint: 'rgba(138, 111, 192, 0.12)',
    },
  },
  {
    name: 'matcha-deep',
    label: 'Matcha Deep',
    dark: true,
    colors: {
      background: '#0D1A12',
      header: '#08130D',
      surface: '#14251B',
      surfaceElevated: '#14251B',
      border: '#23392B',
      textStrong: '#EAF7EC',
      textSecondary: '#C4DCC9',
      textMuted: '#93AF9A',
      textFaint: '#6E8A75',
      accent: '#8FCB9B',
      accentDark: '#5B8C68',
      accentTint: 'rgba(143, 203, 155, 0.15)',
      success: '#7FD8A0',
      successTint: 'rgba(127, 216, 160, 0.15)',
      danger: '#F27C7C',
      dangerDark: '#D9534F',
      dangerTint: 'rgba(242, 124, 124, 0.15)',
      warning: '#E8C97A',
      warningTint: 'rgba(232, 201, 122, 0.15)',
      purple: '#B7A6E8',
      purpleTint: 'rgba(183, 166, 232, 0.15)',
    },
  },
  {
    name: 'strawberry-milk',
    label: 'Strawberry Milk',
    dark: false,
    colors: {
      background: '#FFF4F5',
      header: '#F8E0E4',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      border: '#F0D4D9',
      textStrong: '#3A2730',
      textSecondary: '#6B5560',
      textMuted: '#9C7F8A',
      textFaint: '#B098A2',
      accent: '#E36A8F',
      accentDark: '#C75078',
      accentTint: 'rgba(227, 106, 143, 0.15)',
      success: '#6FA87E',
      successTint: 'rgba(111, 168, 126, 0.15)',
      danger: '#E0534F',
      dangerDark: '#C74440',
      dangerTint: 'rgba(224, 83, 79, 0.12)',
      warning: '#C98A2E',
      warningTint: 'rgba(201, 138, 46, 0.15)',
      purple: '#B084D8',
      purpleTint: 'rgba(176, 132, 216, 0.15)',
    },
  },
  {
    name: 'warm-oatmeal',
    label: 'Warm Oatmeal',
    dark: false,
    colors: {
      background: '#F6F0E6',
      header: '#EAE0CE',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      border: '#E4D9C4',
      textStrong: '#3A3125',
      textSecondary: '#6A5C48',
      textMuted: '#9A8A71',
      textFaint: '#B0A187',
      accent: '#C0782F',
      accentDark: '#A05F1F',
      accentTint: 'rgba(192, 120, 47, 0.15)',
      success: '#8A9B5C',
      successTint: 'rgba(138, 155, 92, 0.15)',
      danger: '#C9563F',
      dangerDark: '#AB432F',
      dangerTint: 'rgba(201, 86, 63, 0.12)',
      warning: '#C29345',
      warningTint: 'rgba(194, 147, 69, 0.15)',
      purple: '#9A7FC0',
      purpleTint: 'rgba(154, 127, 192, 0.15)',
    },
  },
];

interface ThemeContextValue {
  themeName: ThemeName;
  colors: ThemeColors;
  isDark: boolean;
  setThemeName: (name: ThemeName) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeName: 'default',
  colors: THEMES[0].colors,
  isDark: true,
  setThemeName: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeNameState] = useState<ThemeName>('default');

  useEffect(() => {
    container.configRepository
      .getSetting(SETTING_KEY)
      .then((saved) => {
        if (saved && THEMES.some((t) => t.name === saved)) {
          setThemeNameState(saved as ThemeName);
        }
      })
      .catch(() => {});
  }, []);

  const setThemeName = useCallback(async (name: ThemeName) => {
    setThemeNameState(name);
    try {
      await container.configRepository.setSetting(SETTING_KEY, name);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const theme =
      THEMES.find((t) => t.name === themeName) || THEMES[0];
    return {
      themeName: theme.name,
      colors: theme.colors,
      isDark: theme.dark,
      setThemeName,
    };
  }, [themeName, setThemeName]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}