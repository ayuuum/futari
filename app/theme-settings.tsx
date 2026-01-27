import { ThemeName, themeMetadata, themes } from '@/constants/themes';
import { useTheme } from '@/contexts/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const themeOptions: ThemeName[] = ['pink', 'blue', 'purple', 'mint'];

export default function ThemeSettingsScreen() {
    const {
        theme,
        themeName,
        setThemeName,
        toggleColorMode,
        isDark,
        useSystemColorMode,
        setUseSystemColorMode,
    } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome name="arrow-left" size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>🎨 テーマ設定</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Color Theme Selection */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
                        カラーテーマ
                    </Text>
                    <View style={styles.themeGrid}>
                        {themeOptions.map((name) => {
                            const meta = themeMetadata[name];
                            const isSelected = themeName === name;
                            // Use light mode primary color for preview
                            const previewColor = themes[name].light.primary;

                            return (
                                <TouchableOpacity
                                    key={name}
                                    style={[
                                        styles.themeCard,
                                        {
                                            backgroundColor: theme.card,
                                            borderColor: isSelected ? previewColor : theme.border,
                                            borderWidth: isSelected ? 2 : 1,
                                            elevation: isSelected ? 4 : 1,
                                            shadowOpacity: isSelected ? 0.1 : 0.05,
                                        },
                                    ]}
                                    onPress={() => setThemeName(name)}
                                >
                                    <View style={[styles.themePreview, { backgroundColor: previewColor }]}>
                                        <Text style={styles.themeEmoji}>{meta.emoji}</Text>
                                    </View>
                                    <Text style={[styles.themeName, { color: theme.text }]}>
                                        {meta.name}
                                    </Text>
                                    {isSelected && (
                                        <View style={[styles.checkBadge, { backgroundColor: previewColor }]}>
                                            <FontAwesome name="check" size={10} color="#fff" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Color Mode */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
                        カラーモード
                    </Text>
                    <View style={[styles.settingsCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: theme.isDark ? 1 : 0 }]}>
                        {/* System Mode */}
                        <View style={styles.settingItem}>
                            <View style={styles.settingInfo}>
                                <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
                                    <FontAwesome name="mobile" size={20} color={theme.primary} />
                                </View>
                                <View style={styles.settingText}>
                                    <Text style={[styles.settingTitle, { color: theme.text }]}>
                                        端末の設定に合わせる
                                    </Text>
                                    <Text style={[styles.settingDesc, { color: theme.textMuted }]}>
                                        システムのダークモード設定を使用
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={useSystemColorMode}
                                onValueChange={setUseSystemColorMode}
                                trackColor={{ false: theme.border, true: theme.primary }}
                                thumbColor="#fff"
                            />
                        </View>

                        {/* Manual Mode Toggle */}
                        {!useSystemColorMode && (
                            <View style={[styles.settingItem, { borderTopWidth: 1, borderTopColor: theme.border }]}>
                                <View style={styles.settingInfo}>
                                    <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
                                        <FontAwesome
                                            name={isDark ? 'moon-o' : 'sun-o'}
                                            size={20}
                                            color={theme.primary}
                                        />
                                    </View>
                                    <View style={styles.settingText}>
                                        <Text style={[styles.settingTitle, { color: theme.text }]}>
                                            ダークモード
                                        </Text>
                                        <Text style={[styles.settingDesc, { color: theme.textMuted }]}>
                                            {isDark ? 'オン - 目に優しい暗いテーマ' : 'オフ - 明るいテーマ'}
                                        </Text>
                                    </View>
                                </View>
                                <Switch
                                    value={isDark}
                                    onValueChange={toggleColorMode}
                                    trackColor={{ false: theme.border, true: theme.primary }}
                                    thumbColor="#fff"
                                />
                            </View>
                        )}
                    </View>
                </View>

                {/* Preview */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
                        プレビュー
                    </Text>
                    <View style={[styles.previewCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: theme.isDark ? 1 : 0 }]}>
                        <View style={styles.previewHeader}>
                            <View style={[styles.previewAvatar, { backgroundColor: theme.primary + '20' }]}>
                                <Text style={styles.previewAvatarText}>💑</Text>
                            </View>
                            <View>
                                <Text style={[styles.previewTitle, { color: theme.text }]}>
                                    ふたりのホーム
                                </Text>
                                <Text style={[styles.previewSubtitle, { color: theme.textSecondary }]}>
                                    パートナーと一緒に
                                </Text>
                            </View>
                        </View>
                        <View style={styles.previewButtons}>
                            <TouchableOpacity
                                style={[styles.previewButton, { backgroundColor: theme.primary }]}
                            >
                                <Text style={styles.previewButtonText}>支出を追加</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.previewButton,
                                    { backgroundColor: theme.primary + '10', borderWidth: 1, borderColor: theme.primary }
                                ]}
                            >
                                <Text style={[styles.previewButtonText, { color: theme.primary }]}>
                                    家事完了
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    themeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    themeCard: {
        width: '47%',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
    },
    themePreview: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    themeEmoji: {
        fontSize: 28,
    },
    themeName: {
        fontSize: 15,
        fontWeight: '600',
    },
    checkBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsCard: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingText: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 15,
        fontWeight: '500',
    },
    settingDesc: {
        fontSize: 12,
        marginTop: 2,
    },
    previewCard: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    previewAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewAvatarText: {
        fontSize: 24,
    },
    previewTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    previewSubtitle: {
        fontSize: 13,
    },
    previewButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    previewButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    previewButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
});
