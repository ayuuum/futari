import { ThemeColors } from '@/constants/themes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useExpenses } from '@/lib/queries';
import { useAuthStore } from '@/stores/authStore';
import { Link } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';

const categories = [
    { id: 'all', name: 'すべて', emoji: '📊' },
    { id: 'food', name: '食費', emoji: '🍽️' },
    { id: 'utilities', name: '光熱費', emoji: '💡' },
    { id: 'rent', name: '家賃', emoji: '🏠' },
    { id: 'entertainment', name: '娯楽', emoji: '🎮' },
    { id: 'daily', name: '日用品', emoji: '🧴' },
    { id: 'other', name: 'その他', emoji: '📦' },
];

const categoryColors: Record<string, string> = {
    家賃: '#FF6B9D',
    食費: '#4ECDC4',
    光熱費: '#FFE66D',
    娯楽: '#6BCB77',
    日用品: '#9B59B6',
    その他: '#95A5A6',
    交通費: '#3498DB',
    医療費: '#E74C3C',
};

export default function ExpensesScreen() {
    const { theme } = useTheme();
    const styles = useThemedStyles(createStyles);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const { profile, partner } = useAuthStore();
    const coupleId = profile?.couple_id ?? null;
    const myId = profile?.id ?? '';
    const { data: expenses = [], isLoading } = useExpenses(coupleId);

    const formatCurrency = (amount: number) => amount.toLocaleString('ja-JP');

    const monthlySummary = useMemo(() => {
        const total = expenses.reduce((s, e) => s + e.amount, 0);
        const myTotal = expenses.filter((e) => e.paid_by === myId).reduce((s, e) => s + e.amount, 0);
        const partnerTotal = total - myTotal;
        const byCat: Record<string, number> = {};
        expenses.forEach((e) => {
            byCat[e.category] = (byCat[e.category] ?? 0) + e.amount;
        });
        const byCategory = Object.entries(byCat).map(([name, amount]) => ({
            name,
            amount,
            color: categoryColors[name] ?? '#95A5A6',
        }));
        byCategory.sort((a, b) => b.amount - a.amount);
        return { total, myTotal, partnerTotal, byCategory };
    }, [expenses, myId]);

    const filteredExpenses = useMemo(() => {
        if (selectedCategory === 'all') return expenses;
        const catName = categories.find((c) => c.id === selectedCategory)?.name;
        return catName ? expenses.filter((e) => e.category === catName) : expenses;
    }, [expenses, selectedCategory]);

    const paidByLabel = (paidById: string) => (paidById === myId ? 'あなた' : (partner?.display_name ?? 'パートナー'));

    const renderExpenseItem = ({ item }: { item: (typeof expenses)[0] }) => (
        <View style={styles.expenseItem}>
            <View style={styles.expenseLeft}>
                <Text style={styles.expenseDescription}>{item.description ?? ''}</Text>
                <Text style={styles.expenseMeta}>
                    {item.category} • {item.date} • {paidByLabel(item.paid_by)}
                </Text>
            </View>
            <Text style={styles.expenseAmount}>¥{formatCurrency(item.amount)}</Text>
        </View>
    );

    if (!coupleId && profile) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
                <Text style={{ color: theme.textSecondary }}>パートナーと連携すると家計を記録できます</Text>
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
            {/* Monthly Summary */}
            <View style={styles.summarySection}>
                <Text style={styles.summaryLabel}>今月の支出</Text>
                <Text style={styles.summaryAmount}>¥{formatCurrency(monthlySummary.total)}</Text>

                <View style={styles.shareRow}>
                    <View style={styles.shareItem}>
                        <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
                            <Text style={styles.avatarText}>あ</Text>
                        </View>
                        <Text style={styles.shareAmount}>¥{formatCurrency(monthlySummary.myTotal)}</Text>
                    </View>
                    <View style={styles.shareItem}>
                        <View style={[styles.avatarCircle, { backgroundColor: theme.secondary }]}>
                            <Text style={styles.avatarText}>パ</Text>
                        </View>
                        <Text style={styles.shareAmount}>¥{formatCurrency(monthlySummary.partnerTotal)}</Text>
                    </View>
                </View>

                {/* Category Bar */}
                {monthlySummary.byCategory.length > 0 && (
                <View style={styles.categoryBar}>
                    {monthlySummary.byCategory.map((cat, index) => (
                        <View
                            key={cat.name}
                            style={[
                                styles.categorySegment,
                                {
                                    backgroundColor: index === 0 ? theme.primary : (index === 1 ? theme.secondary : cat.color),
                                    flex: cat.amount / monthlySummary.total,
                                },
                                index === 0 && { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
                                index === monthlySummary.byCategory.length - 1 && { borderTopRightRadius: 4, borderBottomRightRadius: 4 },
                            ]}
                        />
                    ))}
                </View>
                )}
            </View>

            {/* Category Filter */}
            <View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryFilter}
                    contentContainerStyle={styles.categoryFilterContent}
                >
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.categoryChip,
                                selectedCategory === cat.id && styles.categoryChipActive,
                            ]}
                            onPress={() => setSelectedCategory(cat.id)}
                        >
                            <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                            <Text
                                style={[
                                    styles.categoryText,
                                    selectedCategory === cat.id && styles.categoryTextActive,
                                ]}
                            >
                                {cat.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Expense List */}
            <FlatList
                data={filteredExpenses}
                renderItem={renderExpenseItem}
                keyExtractor={(item) => item.id}
                style={styles.expenseList}
                contentContainerStyle={styles.expenseListContent}
                showsVerticalScrollIndicator={false}
            />

            {/* FAB */}
            <Link href="/expenses/add" asChild>
                <TouchableOpacity style={styles.fab}>
                    <Text style={styles.fabText}>+</Text>
                </TouchableOpacity>
            </Link>
        </View>
    );
}

const createStyles = (theme: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    summarySection: {
        backgroundColor: theme.card,
        padding: 20,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    summaryLabel: {
        fontSize: 14,
        color: theme.subtext,
    },
    summaryAmount: {
        fontSize: 32,
        fontWeight: '700',
        color: theme.text,
        marginVertical: 8,
    },
    shareRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        gap: 24,
        marginVertical: 12,
    },
    shareItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    avatarCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    shareAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
    },
    categoryBar: {
        flexDirection: 'row',
        height: 8,
        marginTop: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    categorySegment: {
        height: '100%',
    },
    categoryFilter: {
        backgroundColor: theme.card,
        maxHeight: 60,
    },
    categoryFilterContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.isDark ? '#333' : '#f5f5f5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
    categoryChipActive: {
        backgroundColor: theme.primary,
    },
    categoryEmoji: {
        fontSize: 14,
        marginRight: 4,
    },
    categoryText: {
        fontSize: 13,
        color: theme.subtext,
    },
    categoryTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    expenseList: {
        flex: 1,
        marginTop: 8,
    },
    expenseListContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    expenseItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: theme.isDark ? 1 : 0,
        borderColor: theme.border,
    },
    expenseLeft: {
        flex: 1,
    },
    expenseDescription: {
        fontSize: 15,
        fontWeight: '500',
        color: theme.text,
        marginBottom: 4,
    },
    expenseMeta: {
        fontSize: 12,
        color: theme.subtext,
    },
    expenseAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    fabText: {
        fontSize: 28,
        color: '#fff',
        fontWeight: '300',
    },
});
