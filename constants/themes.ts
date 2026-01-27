// Futari Theme System
// カラーパレット定義

export type ThemeName = 'pink' | 'blue' | 'purple' | 'mint';
export type ColorMode = 'light' | 'dark';

export interface ThemeColors {
    // Primary colors
    primary: string;
    primaryLight: string;
    primaryDark: string;

    // Secondary colors
    secondary: string;
    accent: string;

    // Background colors
    background: string;
    backgroundSecondary: string;
    card: string;

    // Text colors
    text: string;
    textSecondary: string;
    textMuted: string;

    // UI colors
    border: string;
    divider: string;

    // Status colors
    success: string;
    warning: string;
    error: string;
    info: string;

    // Category colors (for expenses, chores, etc.)
    category: {
        food: string;
        utilities: string;
        entertainment: string;
        transportation: string;
        healthcare: string;
        shopping: string;
        other: string;
    };
}

// Light mode base colors
const lightBase = {
    background: '#FFF9F0',
    backgroundSecondary: '#FFF5E6',
    card: '#FFFFFF',
    text: '#333333',
    textSecondary: '#666666',
    textMuted: '#999999',
    border: '#EEEEEE',
    divider: '#F5F5F5',
    success: '#4ECDC4',
    warning: '#FFB347',
    error: '#E74C3C',
    info: '#3498DB',
    category: {
        food: '#4ECDC4',
        utilities: '#3498DB',
        entertainment: '#9B59B6',
        transportation: '#FFB347',
        healthcare: '#E74C3C',
        shopping: '#FF6B9D',
        other: '#95A5A6',
    },
};

// Dark mode base colors
const darkBase = {
    background: '#1A1A2E',
    backgroundSecondary: '#16213E',
    card: '#0F3460',
    text: '#EAEAEA',
    textSecondary: '#B8B8B8',
    textMuted: '#888888',
    border: '#2A2A4A',
    divider: '#252545',
    success: '#4ECDC4',
    warning: '#FFB347',
    error: '#E74C3C',
    info: '#3498DB',
    category: {
        food: '#4ECDC4',
        utilities: '#3498DB',
        entertainment: '#9B59B6',
        transportation: '#FFB347',
        healthcare: '#E74C3C',
        shopping: '#FF6B9D',
        other: '#95A5A6',
    },
};

// Theme presets
export const themes: Record<ThemeName, { light: ThemeColors; dark: ThemeColors }> = {
    pink: {
        light: {
            ...lightBase,
            primary: '#FF6B9D',
            primaryLight: '#FFE4EC',
            primaryDark: '#E91E63',
            secondary: '#FF8FB1',
            accent: '#FFB6C1',
        },
        dark: {
            ...darkBase,
            primary: '#FF6B9D',
            primaryLight: '#4A2035',
            primaryDark: '#FF8FB1',
            secondary: '#FF8FB1',
            accent: '#FFB6C1',
        },
    },
    blue: {
        light: {
            ...lightBase,
            primary: '#4A90D9',
            primaryLight: '#E3F2FD',
            primaryDark: '#1976D2',
            secondary: '#64B5F6',
            accent: '#81D4FA',
        },
        dark: {
            ...darkBase,
            primary: '#4A90D9',
            primaryLight: '#1A365D',
            primaryDark: '#64B5F6',
            secondary: '#64B5F6',
            accent: '#81D4FA',
        },
    },
    purple: {
        light: {
            ...lightBase,
            primary: '#9B59B6',
            primaryLight: '#F3E5F5',
            primaryDark: '#7B1FA2',
            secondary: '#BA68C8',
            accent: '#CE93D8',
        },
        dark: {
            ...darkBase,
            primary: '#9B59B6',
            primaryLight: '#2D1B3D',
            primaryDark: '#BA68C8',
            secondary: '#BA68C8',
            accent: '#CE93D8',
        },
    },
    mint: {
        light: {
            ...lightBase,
            primary: '#4ECDC4',
            primaryLight: '#E0F7F5',
            primaryDark: '#00897B',
            secondary: '#80DEEA',
            accent: '#A7FFEB',
        },
        dark: {
            ...darkBase,
            primary: '#4ECDC4',
            primaryLight: '#1A3D3A',
            primaryDark: '#80DEEA',
            secondary: '#80DEEA',
            accent: '#A7FFEB',
        },
    },
};

// Theme metadata for UI display
export const themeMetadata: Record<ThemeName, { name: string; emoji: string; description: string }> = {
    pink: {
        name: 'ピンク',
        emoji: '💕',
        description: 'ラブリーで温かみのあるテーマ',
    },
    blue: {
        name: 'ブルー',
        emoji: '💙',
        description: '爽やかで落ち着いたテーマ',
    },
    purple: {
        name: 'パープル',
        emoji: '💜',
        description: 'エレガントで神秘的なテーマ',
    },
    mint: {
        name: 'ミント',
        emoji: '💚',
        description: 'フレッシュで癒されるテーマ',
    },
};

export function getTheme(themeName: ThemeName, colorMode: ColorMode): ThemeColors {
    return themes[themeName][colorMode];
}
