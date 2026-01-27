import { ThemeColors } from '@/constants/themes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import {
    useAddRecurringExpense,
    useRecurringExpenses,
    useUpdateRecurringExpense,
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

const CATEGORIES = [
    { id: '住居', color: '#FF6B9D', icon: 'home' },
    { id: '光熱費', color: '#FFB347', icon: 'bolt' },
    { id: '通信費', color: '#4ECDC4', icon: 'wifi' },
    { id: 'サブスク', color: '#9B59B6', icon: 'play-circle' },
    { id: '保険', color: '#3498DB', icon: 'shield' },
    { id: 'その他', color: '#95A5A6', icon: 'ellipsis-h' },
];

export default function RecurringExpensesScreen() {
    const { theme } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { profile } = useAuthStore();
    const coupleId = profile?.couple_id ?? null;
    const { data: expenses = [], isLoading } = useRecurringExpenses(coupleId);
    const addRecurring = useAddRecurringExpense();
    const updateRecurring = useUpdateRecurringExpense();

    const [showAddModal, setShowAddModal] = useState(false);
    const [newExpense, setNewExpense] = useState({
        name: '',
        amount: '',
        category: '住居',
        dueDay: '27',
    });

    const totalMonthly = expenses.filter((e) => e.is_active).reduce((sum, e) => sum + e.amount, 0);
    const totalYearly = totalMonthly * 12;

    const formatCurrency = (amount: number) => amount.toLocaleString('ja-JP');

    const getCategoryInfo = (categoryId: string) => {
        return CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1];
    };

    const groupedExpenses = expenses.reduce((groups, expense) => {
        const category = expense.category;
        if (!groups[category]) groups[category] = [];
        groups[category].push(expense);
        return groups;
    }, {} as Record<string, typeof expenses>);

    const handleAddExpense = async () => {
        const name = newExpense.name.trim();
        const amount = parseInt(newExpense.amount, 10);
        const paymentDay = Math.min(31, Math.max(1, parseInt(newExpense.dueDay, 10) || 1));
        if (!name || !newExpense.amount || !coupleId) return;
        try {
            await addRecurring.mutateAsync({
                couple_id: coupleId,
                name,
                amount: isNaN(amount) ? 0 : amount,
                category: newExpense.category,
                payment_day: paymentDay,
                is_active: true,
            });
            setShowAddModal(false);
            setNewExpense({ name: '', amount: '', category: '住居', dueDay: '27' });
        } catch (e: any) {
            Alert.alert('エラー', e?.message ?? '追加に失敗しました');
        }
    };

    const toggleExpense = async (id: string, currentActive: boolean) => {
        if (!coupleId) return;
        try {
            await updateRecurring.mutateAsync({
                id,
                coupleId,
                updates: { is_active: !currentActive },
            });
        } catch (e: any) {
            Alert.alert('エラー', e?.message ?? '更新に失敗しました');
        }
    };

    if (!coupleId && profile) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
                <Text style={{ color: theme.textSecondary }}>パートナーと連携すると固定費を管理できます</Text>
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
                <Text style={styles.headerTitle}>🔄 固定費管理</Text>
                <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
                    <FontAwesome name="plus" size={18} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>月額合計</Text>
                            <Text style={styles.summaryAmount}>¥{formatCurrency(totalMonthly)}</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>年間合計</Text>
                            <Text style={styles.summaryAmountSmall}>¥{formatCurrency(totalYearly)}</Text>
                        </View>
                    </View>
                    <Text style={styles.summaryNote}>
                        💡 固定費を見直して節約しましょう
                    </Text>
                </View>

                {/* Expenses by Category */}
                {(Object.entries(groupedExpenses) as [string, any[]][]).map(([category, categoryExpenses]) => {
                    const categoryInfo = getCategoryInfo(category);
                    const categoryTotal = categoryExpenses.reduce((sum: number, e: any) => (e.is_active ? sum + e.amount : sum), 0);

                    return (
                        <View key={category} style={styles.categorySection}>
                            <View style={styles.categoryHeader}>
                                <View style={styles.categoryTitleRow}>
                                    <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color + '20' }]}>
                                        <FontAwesome name={categoryInfo.icon as any} size={16} color={categoryInfo.color} />
                                    </View>
                                    <Text style={styles.categoryTitle}>{category}</Text>
                                </View>
                                <Text style={styles.categoryTotal}>¥{formatCurrency(categoryTotal)}/月</Text>
                            </View>

                            <View style={styles.expensesList}>
                                {categoryExpenses.map((expense: any) => (
                                    <View
                                        key={expense.id}
                                        style={[styles.expenseItem, !expense.is_active && styles.expenseItemInactive]}
                                    >
                                        <TouchableOpacity
                                            style={styles.expenseToggle}
                                            onPress={() => toggleExpense(expense.id, expense.is_active)}
                                            disabled={updateRecurring.isPending}
                                        >
                                            <FontAwesome
                                                name={expense.is_active ? 'check-circle' : 'circle-o'}
                                                size={22}
                                                color={expense.is_active ? '#4ECDC4' : '#ddd'}
                                            />
                                        </TouchableOpacity>
                                        <View style={styles.expenseInfo}>
                                            <Text style={[styles.expenseName, !expense.is_active && styles.expenseNameInactive]}>
                                                {expense.name}
                                            </Text>
                                            <Text style={styles.expenseDueDay}>毎月{expense.payment_day}日</Text>
                                        </View>
                                        <Text style={[styles.expenseAmount, !expense.is_active && styles.expenseAmountInactive]}>
                                            ¥{formatCurrency(expense.amount)}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    );
                })}

                {/* Tips Section */}
                <View style={styles.tipsSection}>
                    <Text style={styles.tipsTitle}>💡 節約のヒント</Text>
                    <View style={styles.tipCard}>
                        <Text style={styles.tipText}>
                            サブスクは定期的に見直しましょう。使っていないサービスはオフにして節約できます。
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
                            <Text style={styles.modalTitle}>固定費を追加</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <FontAwesome name="times" size={22} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalForm}>
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>名前</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="例: 家賃"
                                    placeholderTextColor={theme.textMuted}
                                    value={newExpense.name}
                                    onChangeText={(text) => setNewExpense({ ...newExpense, name: text })}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>金額（円）</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="80000"
                                    placeholderTextColor={theme.textMuted}
                                    keyboardType="numeric"
                                    value={newExpense.amount}
                                    onChangeText={(text) => setNewExpense({ ...newExpense, amount: text })}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>カテゴリ</Text>
                                <View style={styles.categorySelect}>
                                    {CATEGORIES.map((cat) => (
                                        <TouchableOpacity
                                            key={cat.id}
                                            style={[
                                                styles.categoryOption,
                                                newExpense.category === cat.id && {
                                                    backgroundColor: cat.color + '20',
                                                    borderColor: cat.color,
                                                }
                                            ]}
                                            onPress={() => setNewExpense({ ...newExpense, category: cat.id })}
                                        >
                                            <FontAwesome name={cat.icon as any} size={14} color={cat.color} />
                                            <Text style={[
                                                styles.categoryOptionText,
                                                newExpense.category === cat.id && { color: cat.color }
                                            ]}>
                                                {cat.id}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>支払日（毎月）</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="27"
                                    placeholderTextColor={theme.textMuted}
                                    keyboardType="numeric"
                                    value={newExpense.dueDay}
                                    onChangeText={(text) => setNewExpense({ ...newExpense, dueDay: text })}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveButton, (!newExpense.name || !newExpense.amount) && styles.saveButtonDisabled]}
                            onPress={handleAddExpense}
                            disabled={!newExpense.name || !newExpense.amount || addRecurring.isPending}
                        >
                            <Text style={styles.saveButtonText}>{addRecurring.isPending ? '追加中...' : '追加する'}</Text>
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
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: isDark ? 1 : 0,
        borderColor: theme.border,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryDivider: {
        width: 1,
        height: 50,
        backgroundColor: theme.divider,
    },
    summaryLabel: {
        fontSize: 12,
        color: theme.textSecondary,
        marginBottom: 4,
    },
    summaryAmount: {
        fontSize: 28,
        fontWeight: '700',
        color: theme.primary,
    },
    summaryAmountSmall: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.text,
    },
    summaryNote: {
        textAlign: 'center',
        fontSize: 13,
        color: theme.textSecondary,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: theme.border,
    },
    categorySection: {
        marginTop: 24,
        marginHorizontal: 16,
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    categoryIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
    },
    categoryTotal: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.textSecondary,
    },
    expensesList: {
        backgroundColor: theme.card,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: isDark ? 1 : 0,
        borderColor: theme.border,
    },
    expenseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    expenseItemInactive: {
        opacity: 0.5,
    },
    expenseToggle: {
        marginRight: 12,
    },
    expenseInfo: {
        flex: 1,
    },
    expenseName: {
        fontSize: 15,
        fontWeight: '500',
        color: theme.text,
    },
    expenseNameInactive: {
        textDecorationLine: 'line-through',
    },
    expenseDueDay: {
        fontSize: 12,
        color: theme.textMuted,
        marginTop: 2,
    },
    expenseAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
    },
    expenseAmountInactive: {
        color: theme.textMuted,
    },
    tipsSection: {
        marginTop: 32,
        marginHorizontal: 16,
    },
    tipsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 12,
    },
    tipCard: {
        backgroundColor: isDark ? '#1a332e' : '#E8F8F5',
        borderRadius: 12,
        padding: 16,
    },
    tipText: {
        fontSize: 14,
        color: isDark ? '#4ECDC4' : '#2C7A6B',
        lineHeight: 20,
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
        backgroundColor: isDark ? '#333' : '#f8f8f8',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: theme.text,
    },
    categorySelect: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: isDark ? '#333' : '#f8f8f8',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    categoryOptionText: {
        fontSize: 13,
        fontWeight: '500',
        color: theme.textSecondary,
    },
    saveButton: {
        backgroundColor: theme.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 24,
    },
    saveButtonDisabled: {
        backgroundColor: '#fcc',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
