import { useTheme } from '@/contexts/ThemeContext';
import { ThemeColors, useThemedStyles } from '@/hooks/useThemedStyles';
import { rephraseRule } from '@/lib/ai';
import {
    useAddRule,
    useConfirmRule,
    useRules,
    useUpdateRule,
} from '@/lib/queries';
import { useAuthStore } from '@/stores/authStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// Rule categories
const CATEGORIES = [
    { id: 'housework', label: '家事', emoji: '🧹', color: '#4ECDC4' },
    { id: 'money', label: 'お金', emoji: '💰', color: '#FFB347' },
    { id: 'lifestyle', label: '生活', emoji: '🏠', color: '#9B59B6' },
    { id: 'time', label: '時間', emoji: '⏰', color: '#3498DB' },
    { id: 'communication', label: 'コミュニケーション', emoji: '💬', color: '#FF6B9D' },
    { id: 'other', label: 'その他', emoji: '📌', color: '#95A5A6' },
];

export default function RulebookScreen() {
    const { theme, isDark } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { profile } = useAuthStore();
    const coupleId = profile?.couple_id ?? null;
    const myId = profile?.id ?? '';
    const { data: rules = [], isLoading } = useRules(coupleId);
    const addRule = useAddRule();
    const updateRule = useUpdateRule();
    const confirmRule = useConfirmRule();

    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [newRule, setNewRule] = useState({
        title: '',
        category: 'housework',
    });
    const [rephrasing, setRephrasing] = useState(false);

    const getCategoryInfo = (categoryId: string) => {
        return CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1];
    };

    const filteredRules = selectedCategory
        ? rules.filter((r) => r.category === selectedCategory && r.is_active)
        : rules.filter((r) => r.is_active);

    const handleAddRule = async () => {
        const title = newRule.title.trim();
        if (!title || !coupleId) return;
        try {
            await addRule.mutateAsync({
                couple_id: coupleId,
                title,
                category: newRule.category,
                created_by: myId || null,
                is_active: true,
            });
            setShowAddModal(false);
            setNewRule({ title: '', category: 'housework' });
        } catch (e: any) {
            Alert.alert('エラー', e?.message ?? '追加に失敗しました');
        }
    };

    const handleConfirmRule = async (id: string) => {
        if (!coupleId) return;
        try {
            await confirmRule.mutateAsync({ id, coupleId });
        } catch (e: any) {
            Alert.alert('エラー', e?.message ?? '更新に失敗しました');
        }
    };

    const handleDeleteRule = (id: string) => {
        if (!coupleId) return;
        Alert.alert('ルールを削除', 'このルールを削除しますか？', [
            { text: 'キャンセル', style: 'cancel' },
            {
                text: '削除',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await updateRule.mutateAsync({ id, coupleId, updates: { is_active: false } });
                    } catch (e: any) {
                        Alert.alert('エラー', e?.message ?? '削除に失敗しました');
                    }
                },
            },
        ]);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    };
    const getDaysSinceConfirm = (dateStr: string) => {
        const today = new Date();
        const confirmed = new Date(dateStr);
        return Math.floor((today.getTime() - confirmed.getTime()) / (1000 * 60 * 60 * 24));
    };

    if (!coupleId && profile) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
                <Text style={{ color: theme.textSecondary }}>パートナーと連携するとルールブックを利用できます</Text>
            </View>
        );
    }
    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome name="arrow-left" size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>📋 二人のルールブック</Text>
                <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
                    <FontAwesome name="plus" size={18} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>🤝 二人で決めたルール</Text>
                    <Text style={styles.summaryCount}>{rules.filter((r) => r.is_active).length}件</Text>
                    <Text style={styles.summaryNote}>
                        定期的に確認して、お互いが守れているかチェックしましょう
                    </Text>
                </View>

                {/* Category Filter */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryFilter}
                    contentContainerStyle={styles.categoryFilterContent}
                >
                    <TouchableOpacity
                        style={[
                            styles.categoryChip,
                            !selectedCategory && styles.categoryChipActive,
                        ]}
                        onPress={() => setSelectedCategory(null)}
                    >
                        <Text style={[
                            styles.categoryChipText,
                            !selectedCategory && styles.categoryChipTextActive,
                        ]}>
                            すべて
                        </Text>
                    </TouchableOpacity>
                    {CATEGORIES.map((category) => {
                        const count = rules.filter((r) => r.category === category.id && r.is_active).length;
                        if (count === 0) return null;
                        return (
                            <TouchableOpacity
                                key={category.id}
                                style={[
                                    styles.categoryChip,
                                    selectedCategory === category.id && {
                                        backgroundColor: category.color + '20',
                                        borderColor: category.color,
                                    },
                                ]}
                                onPress={() => setSelectedCategory(
                                    selectedCategory === category.id ? null : category.id
                                )}
                            >
                                <Text style={styles.categoryChipEmoji}>{category.emoji}</Text>
                                <Text style={[
                                    styles.categoryChipText,
                                    selectedCategory === category.id && { color: category.color },
                                ]}>
                                    {category.label} ({count})
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Rules List */}
                <View style={styles.rulesList}>
                    {filteredRules.map((rule) => {
                        const category = getCategoryInfo(rule.category);
                        const daysSince = getDaysSinceConfirm(rule.last_confirmed_at);
                        const needsConfirm = daysSince > 14;

                        return (
                            <View key={rule.id} style={styles.ruleCard}>
                                <View style={styles.ruleHeader}>
                                    <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
                                        <Text style={styles.categoryBadgeEmoji}>{category.emoji}</Text>
                                        <Text style={[styles.categoryBadgeText, { color: category.color }]}>
                                            {category.label}
                                        </Text>
                                    </View>
                                    {needsConfirm && (
                                        <View style={styles.needsConfirmBadge}>
                                            <Text style={styles.needsConfirmText}>確認が必要</Text>
                                        </View>
                                    )}
                                </View>

                                <Text style={styles.ruleTitle}>{rule.title}</Text>

                                <View style={styles.ruleFooter}>
                                    <Text style={styles.ruleDate}>
                                        {rule.created_by === myId ? '👤' : '💑'} 作成: {formatDate(rule.created_at)}
                                    </Text>
                                    <Text style={styles.ruleConfirmed}>
                                        ✅ 確認: {daysSince === 0 ? '今日' : `${daysSince}日前`}
                                    </Text>
                                </View>

                                <View style={styles.ruleActions}>
                                    <TouchableOpacity
                                        style={styles.confirmButton}
                                        onPress={() => handleConfirmRule(rule.id)}
                                        disabled={confirmRule.isPending}
                                    >
                                        <FontAwesome name="check" size={14} color="#4ECDC4" />
                                        <Text style={styles.confirmButtonText}>確認OK</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.editButton}
                                        onPress={() => handleDeleteRule(rule.id)}
                                    >
                                        <FontAwesome name="trash-o" size={14} color={theme.textMuted} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Tips Section */}
                <View style={styles.tipsSection}>
                    <Text style={styles.tipsTitle}>💡 ルール作りのコツ</Text>
                    <View style={styles.tipCard}>
                        <Text style={styles.tipText}>
                            • 具体的で守りやすいルールにする{'\n'}
                            • お互いが納得してから決める{'\n'}
                            • 定期的に見直して更新する{'\n'}
                            • 守れなかった時は責めずに話し合う
                        </Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Add Modal */}
            <Modal visible={showAddModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>新しいルールを追加</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <FontAwesome name="times" size={22} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalForm}>
                            {/* Category Selection */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>カテゴリ</Text>
                                <View style={styles.categoryGrid}>
                                    {CATEGORIES.map((category) => (
                                        <TouchableOpacity
                                            key={category.id}
                                            style={[
                                                styles.categoryOption,
                                                newRule.category === category.id && {
                                                    backgroundColor: category.color + '20',
                                                    borderColor: category.color,
                                                },
                                            ]}
                                            onPress={() => setNewRule({ ...newRule, category: category.id })}
                                        >
                                            <Text style={styles.categoryOptionEmoji}>{category.emoji}</Text>
                                            <Text style={[
                                                styles.categoryOptionText,
                                                newRule.category === category.id && { color: category.color },
                                            ]}>
                                                {category.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Rule Title */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>ルールの内容</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="例: 洗濯物は必ず洗濯かごに入れる"
                                    placeholderTextColor={theme.textMuted}
                                    value={newRule.title}
                                    onChangeText={(text) => setNewRule({ ...newRule, title: text })}
                                    multiline
                                />
                                {newRule.title.trim().length > 0 && (
                                    <TouchableOpacity
                                        style={styles.rephraseButton}
                                        onPress={async () => {
                                            setRephrasing(true);
                                            try {
                                                const rephrased = await rephraseRule(newRule.title);
                                                setNewRule((r) => ({ ...r, title: rephrased }));
                                            } catch (e: any) {
                                                Alert.alert('AI機能', e?.message ?? '言い換えに失敗しました');
                                            }
                                            setRephrasing(false);
                                        }}
                                        disabled={rephrasing}
                                    >
                                        {rephrasing ? (
                                            <Text style={styles.rephraseButtonText}>AIで言い換え中...</Text>
                                        ) : (
                                            <Text style={styles.rephraseButtonText}>AIで丁寧な表現に言い換え</Text>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Suggestions */}
                            <View style={styles.suggestionsSection}>
                                <Text style={styles.suggestionsTitle}>よくあるルール例</Text>
                                <View style={styles.suggestionsGrid}>
                                    {[
                                        '使ったものは元の場所に戻す',
                                        '週末は一緒に掃除する',
                                        '毎月の支出を報告し合う',
                                        '帰りが遅い時は連絡する',
                                    ].map((suggestion, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.suggestionChip}
                                            onPress={() => setNewRule({ ...newRule, title: suggestion })}
                                        >
                                            <Text style={styles.suggestionText}>{suggestion}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        <View style={styles.modalNote}>
                            <FontAwesome name="users" size={14} color={theme.primary} />
                            <Text style={styles.modalNoteText}>
                                このルールはパートナーと共有されます
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.saveButton,
                                !newRule.title.trim() && styles.saveButtonDisabled,
                            ]}
                            onPress={handleAddRule}
                            disabled={!newRule.title.trim() || addRule.isPending}
                        >
                            <Text style={styles.saveButtonText}>{addRule.isPending ? '追加中...' : 'ルールを追加'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const createStyles = (theme: ThemeColors, isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
        backgroundColor: theme.background,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryCard: {
        backgroundColor: theme.card,
        marginHorizontal: 16,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: isDark ? 1 : 0,
        borderColor: theme.border,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 8,
    },
    summaryCount: {
        fontSize: 48,
        fontWeight: '700',
        color: theme.primary,
    },
    summaryNote: {
        fontSize: 13,
        color: theme.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },
    categoryFilter: {
        marginTop: 20,
    },
    categoryFilterContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.card,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.border,
        marginRight: 8,
    },
    categoryChipActive: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
    },
    categoryChipEmoji: {
        fontSize: 14,
        marginRight: 4,
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: '500',
        color: theme.textSecondary,
    },
    categoryChipTextActive: {
        color: '#fff',
    },
    rulesList: {
        marginTop: 20,
        marginHorizontal: 16,
    },
    ruleCard: {
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
        borderWidth: isDark ? 1 : 0,
        borderColor: theme.border,
    },
    ruleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryBadgeEmoji: {
        fontSize: 12,
        marginRight: 4,
    },
    categoryBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    needsConfirmBadge: {
        backgroundColor: theme.primary + '15',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    needsConfirmText: {
        fontSize: 10,
        fontWeight: '600',
        color: theme.primary,
    },
    ruleTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.text,
        lineHeight: 22,
        marginBottom: 12,
    },
    ruleFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    ruleDate: {
        fontSize: 12,
        color: theme.textMuted,
    },
    ruleConfirmed: {
        fontSize: 12,
        color: theme.textMuted,
    },
    ruleActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.divider,
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.success + '15',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    confirmButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.success,
    },
    editButton: {
        padding: 8,
    },
    tipsSection: {
        marginTop: 24,
        marginHorizontal: 16,
    },
    tipsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 12,
    },
    tipCard: {
        backgroundColor: theme.primary + '15',
        borderRadius: 12,
        padding: 16,
    },
    tipText: {
        fontSize: 14,
        color: theme.textSecondary,
        lineHeight: 24,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.text,
    },
    modalForm: {
        gap: 20,
    },
    formGroup: {
        gap: 8,
    },
    formLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.textSecondary,
    },
    formInput: {
        backgroundColor: theme.backgroundSecondary,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: theme.text,
        minHeight: 60,
    },
    rephraseButton: {
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: theme.info + '15',
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    rephraseButtonText: {
        fontSize: 13,
        color: theme.info,
        fontWeight: '600',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: theme.backgroundSecondary,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'transparent',
        gap: 4,
    },
    categoryOptionEmoji: {
        fontSize: 14,
    },
    categoryOptionText: {
        fontSize: 12,
        fontWeight: '500',
        color: theme.textSecondary,
    },
    suggestionsSection: {
        marginTop: 8,
    },
    suggestionsTitle: {
        fontSize: 12,
        color: theme.textMuted,
        marginBottom: 8,
    },
    suggestionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    suggestionChip: {
        backgroundColor: theme.backgroundSecondary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
    },
    suggestionText: {
        fontSize: 12,
        color: theme.textSecondary,
    },
    modalNote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: theme.divider,
    },
    modalNoteText: {
        fontSize: 13,
        color: theme.textMuted,
    },
    saveButton: {
        backgroundColor: theme.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    saveButtonDisabled: {
        backgroundColor: theme.primary + '50',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
