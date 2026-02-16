import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { darkTheme, lightTheme, type ThemeColors } from '@/constants/colors';

export function useTheme(): { isDark: boolean; colors: ThemeColors } {
  const { state } = useApp();
  const isDark = state.settings.theme === 'clean-dark';

  const colors = useMemo<ThemeColors>(() => {
    return isDark ? darkTheme : lightTheme;
  }, [isDark]);

  return { isDark, colors };
}
