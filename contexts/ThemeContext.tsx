import { ColorMode, ThemeColors, ThemeName, getTheme } from '@/constants/themes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

const THEME_STORAGE_KEY = '@futari_theme';
const COLOR_MODE_STORAGE_KEY = '@futari_color_mode';

interface ThemeContextType {
    theme: ThemeColors;
    themeName: ThemeName;
    colorMode: ColorMode;
    isDark: boolean;
    setThemeName: (name: ThemeName) => void;
    setColorMode: (mode: ColorMode) => void;
    toggleColorMode: () => void;
    useSystemColorMode: boolean;
    setUseSystemColorMode: (use: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const systemColorScheme = useColorScheme();
    const [themeName, setThemeNameState] = useState<ThemeName>('pink');
    const [colorMode, setColorModeState] = useState<ColorMode>('light');
    const [useSystemColorMode, setUseSystemColorModeState] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load saved preferences
    useEffect(() => {
        loadPreferences();
    }, []);

    // Update color mode when system preference changes
    useEffect(() => {
        if (useSystemColorMode && systemColorScheme) {
            setColorModeState(systemColorScheme as ColorMode);
        }
    }, [systemColorScheme, useSystemColorMode]);

    const loadPreferences = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            const savedColorMode = await AsyncStorage.getItem(COLOR_MODE_STORAGE_KEY);
            const savedUseSystem = await AsyncStorage.getItem('@futari_use_system_color');

            if (savedTheme) {
                setThemeNameState(savedTheme as ThemeName);
            }
            if (savedColorMode) {
                setColorModeState(savedColorMode as ColorMode);
            }
            if (savedUseSystem !== null) {
                setUseSystemColorModeState(savedUseSystem === 'true');
            }
        } catch (error) {
            console.error('Error loading theme preferences:', error);
        } finally {
            setIsLoaded(true);
        }
    };

    const setThemeName = async (name: ThemeName) => {
        setThemeNameState(name);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, name);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    };

    const setColorMode = async (mode: ColorMode) => {
        setColorModeState(mode);
        setUseSystemColorModeState(false);
        try {
            await AsyncStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
            await AsyncStorage.setItem('@futari_use_system_color', 'false');
        } catch (error) {
            console.error('Error saving color mode:', error);
        }
    };

    const toggleColorMode = () => {
        setColorMode(colorMode === 'light' ? 'dark' : 'light');
    };

    const setUseSystemColorMode = async (use: boolean) => {
        setUseSystemColorModeState(use);
        try {
            await AsyncStorage.setItem('@futari_use_system_color', use.toString());
            if (use && systemColorScheme) {
                setColorModeState(systemColorScheme as ColorMode);
            }
        } catch (error) {
            console.error('Error saving system color mode preference:', error);
        }
    };

    const theme = getTheme(themeName, colorMode);

    const value: ThemeContextType = {
        theme,
        themeName,
        colorMode,
        isDark: colorMode === 'dark',
        setThemeName,
        setColorMode,
        toggleColorMode,
        useSystemColorMode,
        setUseSystemColorMode,
    };

    // Don't render children until preferences are loaded
    if (!isLoaded) {
        return null;
    }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

// Hook for getting themed styles
export function useThemedStyles<T>(
    createStyles: (theme: ThemeColors, isDark: boolean) => T
): T {
    const { theme, isDark } = useTheme();
    return createStyles(theme, isDark);
}
