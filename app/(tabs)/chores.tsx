import { ThemeColors } from '@/constants/themes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { getChoreAdvice } from '@/lib/ai';
import {
    useAddChore,
    useAddChoreCompletion,
    useChoreCompletionsThisWeek,
    useChores,
} from '@/lib/queries';
import { useAuthStore } from '@/stores/authStore';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const categoryEmoji: Record<string, string> = {
    掃除: '🧹',
    料理: '🍳',
    洗濯: '👕',
    ゴミ出し: '🗑️',
    買い物: '🛒',
    その他: '📋',
};

const CATEGORIES = Object.keys(categoryEmoji);
const FREQUENCIES = ['毎日', '週1回', '週2回', '月1回', 'その他'];
type AssignedTo = 'me' | 'partner' | 'none';

export default function ChoresScreen() {
    const { theme } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { profile, partner } = useAuthStore();
    const coupleId = profile?.couple_id ?? null;
    const myId = profile?.id ?? '';
    const { data: chores = [], isLoading } = useChores(coupleId);
    const { data: completions = [] } = useChoreCompletionsThisWeek(coupleId);
    const addCompletion = useAddChoreCompletion();
    const addChore = useAddChore();

    const [showAddModal, setShowAddModal] = useState(false);
    const [addName, setAddName] = useState('');
    const [addCategory, setAddCategory] = useState('その他');
    const [addFrequency, setAddFrequency] = useState('週1回');
    const [addAssignedTo, setAddAssignedTo] = useState<AssignedTo>('none');
    const [choreAdvice, setChoreAdvice] = useState('');
    const [loadingChoreAdvice, setLoadingChoreAdvice] = useState(false);

    const myCompleted = useMemo(
        () => completions.filter((c) => c.completed_by === myId).length,
        [completions, myId]
    );
    const partnerCompleted = useMemo(
        () => completions.filter((c) => c.completed_by !== myId).length,
        [completions, myId]
    );

    const partnerName = partner?.display_name ?? 'パートナー';
    const myChoreCount = chores.filter((c) => c.assigned_to === myId).length;
    const partnerChoreCount = chores.filter((c) => c.assigned_to && c.assigned_to !== myId).length;
    const isUnbalanced = chores.length > 0 && Math.abs(myChoreCount - partnerChoreCount) > 2;

    useEffect(() => {
        if (!coupleId || !isUnbalanced) {
            setChoreAdvice('');
            return;
        }
        setLoadingChoreAdvice(true);
        getChoreAdvice({
            myCompleted,
            partnerCompleted,
            myChoreCount: myChoreCount || 1,
            partnerChoreCount: partnerChoreCount || 1,
            partnerName,
        })
            .then(setChoreAdvice)
            .catch(() => setChoreAdvice(''))
            .finally(() => setLoadingChoreAdvice(false));
    }, [coupleId, isUnbalanced, myCompleted, partnerCompleted, myChoreCount, partnerChoreCount, partnerName]);

    const choresByCategory = useMemo(() => {
        const byCat: Record<string, typeof chores> = {};
        chores.forEach((c) => {
            const cat = c.category || 'その他';
            if (!byCat[cat]) byCat[cat] = [];
            byCat[cat].push(c);
        });
        return Object.entries(byCat).map(([name, list]) => ({
            name,
            emoji: categoryEmoji[name] ?? '📋',
            chores: list,
        }));
    }, [chores]);


    const isCompletedThisWeek = (choreId: string) =>
        completions.some((c) => c.chore_id === choreId);

    const handleToggleChore = async (choreId: string) => {
        if (!myId) return;
        try {
            await addCompletion.mutateAsync({ chore_id: choreId, completed_by: myId });
        } catch (_) { }
    };

    const getAssignedToUserId = (): string | null => {
        if (addAssignedTo === 'me') return myId || null;
        if (addAssignedTo === 'partner' && partner?.id) return partner.id;
        return null;
    };

    const handleAddChore = async () => {
        const name = addName.trim();
        if (!name || !coupleId) return;
        try {
            await addChore.mutateAsync({
                couple_id: coupleId,
                name,
                category: addCategory,
                frequency: addFrequency,
                assigned_to: getAssignedToUserId(),
            });
            setShowAddModal(false);
            setAddName('');
            setAddCategory('その他');
            setAddFrequency('週1回');
            setAddAssignedTo('none');
        } catch (_) { }
    };

    if (!coupleId && profile) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
                <Text style={{ color: theme.textSecondary }}>パートナーと連携すると家事を記録できます</Text>
            </View>
        );
    }
    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} testID="loading" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.statsSection}>
                <View style={styles.statsCard}>
                    <Text style={styles.statsTitle}>今週の進捗</Text>
                    <View style={styles.progressRow}>
                        <View style={styles.progressItem}>
                            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                                <Text style={styles.avatarText}>あ</Text>
                            </View>
                            <Text style={styles.progressNumber}>{myCompleted}/{myChoreCount || 1}</Text>
                            <Text style={styles.progressLabel}>あなた</Text>
                        </View>
                        <View style={styles.vsContainer}>
                            <Text style={styles.vsText}>vs</Text>
                        </View>
                        <View style={styles.progressItem}>
                            <View style={[styles.avatar, { backgroundColor: theme.secondary }]}>
                                <Text style={styles.avatarText}>パ</Text>
                            </View>
                            <Text style={[styles.progressNumber, { color: theme.secondary }]}>{partnerCompleted}/{partnerChoreCount || 1}</Text>
                            <Text style={styles.progressLabel}>{partnerName}</Text>
                        </View>
                    </View>
                    {isUnbalanced && (
                        <View style={styles.alertBanner}>
                            <Text style={styles.alertText}>⚠️ タスクが偏っています！調整しましょう</Text>
                            {loadingChoreAdvice && (
                                <Text style={[styles.alertText, { marginTop: 6, fontSize: 12 }]}>AIアドバイスを取得中...</Text>
                            )}
                            {!loadingChoreAdvice && choreAdvice ? (
                                <Text style={[styles.alertText, { marginTop: 8, fontSize: 13, fontWeight: '500' }]}>
                                    💡 {choreAdvice}
                                </Text>
                            ) : null}
                        </View>
                    )}
                </View>
            </View>

            {choresByCategory.map((category) => (
                <View key={category.name} style={styles.categorySection}>
                    <View style={styles.categoryHeader}>
                        <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                        <Text style={styles.categoryName}>{category.name}</Text>
                        <Text style={styles.categoryCount}>
                            {category.chores.filter((c) => isCompletedThisWeek(c.id)).length}/{category.chores.length}
                        </Text>
                    </View>

                    {category.chores.map((chore) => {
                        const completed = isCompletedThisWeek(chore.id);
                        const isMe = chore.assigned_to === myId;
                        return (
                            <TouchableOpacity
                                key={chore.id}
                                style={styles.choreItem}
                                onPress={() => handleToggleChore(chore.id)}
                                activeOpacity={0.7}
                                disabled={addCompletion.isPending}
                            >
                                <View style={styles.choreLeft}>
                                    <View
                                        style={[
                                            styles.checkbox,
                                            completed && { backgroundColor: theme.primary, borderColor: theme.primary },
                                        ]}
                                    >
                                        {completed && <Text style={styles.checkmark}>✓</Text>}
                                    </View>
                                    <View>
                                        <Text
                                            style={[
                                                styles.choreName,
                                                completed && styles.choreNameCompleted,
                                            ]}
                                        >
                                            {chore.name}
                                        </Text>
                                        <Text style={styles.choreFrequency}>{chore.frequency}</Text>
                                    </View>
                                </View>
                                <View
                                    style={[
                                        styles.assigneeBadge,
                                        { backgroundColor: isMe ? theme.primary + '15' : theme.secondary + '15' },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.assigneeText,
                                            { color: isMe ? theme.primary : theme.secondary },
                                        ]}
                                    >
                                        {isMe ? 'あなた' : partnerName}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ))}

            <TouchableOpacity
                style={[styles.addButton, { borderColor: theme.secondary }]}
                onPress={() => setShowAddModal(true)}
                testID="add-chore-button"
            >
                <Text style={[styles.addButtonText, { color: theme.secondary }]}>+ 家事を追加</Text>
            </TouchableOpacity>

            <Modal
                visible={showAddModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowAddModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowAddModal(false)}
                >
                    <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={styles.modalContent}>
                        <Text style={styles.modalTitle}>家事を追加</Text>
                        <TextInput
                            style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]}
                            placeholder="名前（例: 風呂掃除）"
                            placeholderTextColor={theme.textMuted}
                            value={addName}
                            onChangeText={setAddName}
                            autoCapitalize="none"
                            testID="chore-name-input"
                        />
                        <Text style={styles.modalLabel}>カテゴリ</Text>
                        <View style={styles.modalChips}>
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[
                                        styles.modalChip,
                                        addCategory === cat && { backgroundColor: theme.primary, borderColor: theme.primary },
                                        { borderColor: theme.border },
                                    ]}
                                    onPress={() => setAddCategory(cat)}
                                >
                                    <Text
                                        style={[
                                            styles.modalChipText,
                                            { color: addCategory === cat ? '#fff' : theme.text },
                                        ]}
                                    >
                                        {categoryEmoji[cat]} {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={styles.modalLabel}>頻度</Text>
                        <View style={styles.modalChips}>
                            {FREQUENCIES.map((f) => (
                                <TouchableOpacity
                                    key={f}
                                    style={[
                                        styles.modalChip,
                                        addFrequency === f && { backgroundColor: theme.primary, borderColor: theme.primary },
                                        { borderColor: theme.border },
                                    ]}
                                    onPress={() => setAddFrequency(f)}
                                >
                                    <Text
                                        style={[
                                            styles.modalChipText,
                                            { color: addFrequency === f ? '#fff' : theme.text },
                                        ]}
                                    >
                                        {f}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={styles.modalLabel}>担当</Text>
                        <View style={styles.modalRow}>
                            {(['me', 'partner', 'none'] as const).map((key) => (
                                <TouchableOpacity
                                    key={key}
                                    style={[
                                        styles.modalChip,
                                        addAssignedTo === key && { backgroundColor: theme.primary, borderColor: theme.primary },
                                        { borderColor: theme.border },
                                    ]}
                                    onPress={() => setAddAssignedTo(key)}
                                >
                                    <Text
                                        style={[
                                            styles.modalChipText,
                                            { color: addAssignedTo === key ? '#fff' : theme.text },
                                        ]}
                                    >
                                        {key === 'me' ? '自分' : key === 'partner' ? partnerName : '未割り当て'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalButton, { borderColor: theme.border }]} onPress={() => setShowAddModal(false)}>
                                <Text style={{ color: theme.text }}>キャンセル</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: theme.primary }]}
                                onPress={handleAddChore}
                                disabled={!addName.trim() || addChore.isPending}
                            >
                                <Text style={styles.modalButtonPrimaryText}>追加</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const createStyles = (theme: ThemeColors, isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    statsSection: {
        padding: 16,
    },
    statsCard: {
        backgroundColor: theme.card,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: isDark ? 1 : 0,
        borderColor: theme.border,
    },
    statsTitle: {
        fontSize: 14,
        color: theme.textSecondary,
        textAlign: 'center',
        marginBottom: 16,
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressItem: {
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    avatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    progressNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.primary,
    },
    progressLabel: {
        fontSize: 12,
        color: theme.textSecondary,
        marginTop: 4,
    },
    vsContainer: {
        paddingHorizontal: 16,
    },
    vsText: {
        fontSize: 16,
        color: theme.border,
        fontWeight: '600',
    },
    alertBanner: {
        backgroundColor: isDark ? '#443300' : '#FFF3CD',
        borderRadius: 8,
        padding: 12,
        marginTop: 16,
    },
    alertText: {
        color: isDark ? '#FFD700' : '#856404',
        fontSize: 13,
        textAlign: 'center',
    },
    categorySection: {
        backgroundColor: theme.card,
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: isDark ? 1 : 0,
        borderColor: theme.border,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    categoryEmoji: {
        fontSize: 20,
        marginRight: 8,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        flex: 1,
    },
    categoryCount: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    choreItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    choreLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: theme.border,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkmark: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    choreName: {
        fontSize: 15,
        color: theme.text,
        fontWeight: '500',
    },
    choreNameCompleted: {
        color: theme.textSecondary,
        textDecorationLine: 'line-through',
    },
    choreFrequency: {
        fontSize: 12,
        color: theme.textSecondary,
        marginTop: 2,
    },
    assigneeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    assigneeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    addButton: {
        backgroundColor: theme.card,
        marginHorizontal: 16,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderStyle: 'dashed',
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.card,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    modalInput: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 16,
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.textSecondary,
        marginBottom: 8,
    },
    modalChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    modalRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    modalChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    modalChipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    modalButtonPrimary: {
        borderWidth: 0,
    },
    modalButtonPrimaryText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});
