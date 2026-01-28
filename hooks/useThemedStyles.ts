import { ThemeColors, useTheme } from '@/contexts/ThemeContext';
import { useMemo } from 'react';

export type { ThemeColors };

export function useThemedStyles<T>(stylesFactory: (theme: ThemeColors, isDark: boolean) => T): T {
    const { theme, isDark } = useTheme();
    return useMemo(() => stylesFactory(theme, isDark), [theme, isDark, stylesFactory]);
}
