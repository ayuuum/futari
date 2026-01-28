import { useTheme } from '@/contexts/ThemeContext';
import { ThemeColors, useThemedStyles } from '@/hooks/useThemedStyles';
import { getReportSummary, getSpendingAdvice } from '@/lib/ai';
import { useExpenses } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useQueries } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');
const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function getMonthRange(year: number, month: number) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { start, end };
}

const CATEGORY_COLORS: Record<string, string> = {
    食費: '#FF6B9D',
    家賃: '#4ECDC4',
    光熱費: '#FFB347',
    通信費: '#9B59B6',
    娯楽: '#3498DB',
    日用品: '#6BCB77',
    その他: '#95A5A6',
};

interface BarGraphProps {
    data: { month: string; amount: number }[];
    maxValue: number;
}

export default function ReportScreen() {
    const { theme, isDark } = useTheme();
    const styles = useThemedStyles(createStyles);
    const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year'>('month');
    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const { profile, partner } = useAuthStore();
    const coupleId = profile?.couple_id ?? null;
    const myId = profile?.id ?? '';

    function BarGraph({ data, maxValue }: BarGraphProps) {
        return (
            <View style={styles.barGraph}>
                {data.map((item, index) => (
                    <View key={index} style={styles.barItem}>
                        <View style={styles.barContainer}>
                            <View
                                style={[
                                    styles.bar,
                                    {
                                        height: (item.amount / maxValue) * 100,
                                        backgroundColor: index === data.length - 1 ? theme.primary : theme.border,
                                    }
                                ]}
                            />
                        </View>
                        <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 8 }}>{item.month}</Text>
                    </View>
                ))}
            </View>
        );
    }

    const { data: expenses = [], isLoading } = useExpenses(coupleId, selectedYear, selectedMonth);

    const trendMonths = useMemo(() => {
        const list: { year: number; month: number }[] = [];
        let y = selectedYear;
        let m = selectedMonth;
        for (let i = 0; i < 4; i++) {
            list.push({ year: y, month: m });
            m--;
            if (m < 1) {
                m = 12;
                y--;
            }
        }
        return list.reverse();
    }, [selectedYear, selectedMonth]);

    const trendQueries = useQueries({
        queries: trendMonths.map(({ year, month }) => {
            const { start, end } = getMonthRange(year, month);
            return {
                queryKey: ['expenses', coupleId, start, end] as const,
                queryFn: async () => {
                    if (!coupleId) return [];
                    const { data, error } = await supabase
                        .from('expenses')
                        .select('amount')
                        .eq('couple_id', coupleId)
                        .gte('date', start)
                        .lte('date', end);
                    if (error) throw error;
                    return data ?? [];
                },
                enabled: !!coupleId,
            };
        }),
    });

    const data = useMemo(() => {
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const prevMonthExpenses = trendQueries[2]?.data ?? [];
        const prevTotal = prevMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        const byCategory = Object.keys(CATEGORY_COLORS).map(cat => ({
            name: cat,
            amount: expenses.filter(exp => exp.category === cat).reduce((sum, exp) => sum + exp.amount, 0),
            color: CATEGORY_COLORS[cat]
        })).sort((a, b) => b.amount - a.amount);

        const maxCatAmount = Math.max(...byCategory.map(c => c.amount), 1);

        const myExpenses = expenses.filter(exp => exp.user_id === myId).reduce((sum, exp) => sum + exp.amount, 0);
        const partnerExpenses = total - myExpenses;

        const myPercentage = total > 0 ? Math.round((myExpenses / total) * 100) : 50;
        const partnerPercentage = 100 - myPercentage;

        const monthlyTrend = trendMonths.map((m, i) => ({
            month: `${m.month}月`,
            amount: trendQueries[i].data?.reduce((sum, exp: any) => sum + exp.amount, 0) || 0
        }));

        return {
            month: `${selectedMonth}月`,
            total,
            comparison: total - prevTotal,
            byCategory,
            maxCatAmount,
            byPerson: {
                you: { amount: myExpenses, percentage: myPercentage },
                partner: { amount: partnerExpenses, percentage: partnerPercentage }
            },
            chores: {
                you: 45,
                partner: 38,
                total: 83
            },
            monthlyTrend
        };
    }, [expenses, trendQueries, myId, selectedMonth, trendMonths]);

    const maxTrendValue = Math.max(...data.monthlyTrend.map(m => m.amount), 1);

    const [aiSummary, setAiSummary] = useState('');
    const [spendingAdvice, setSpendingAdvice] = useState('');
    const [loadingAI, setLoadingAI] = useState(false);
    const [loadingAdvice, setLoadingAdvice] = useState(false);

    useEffect(() => {
        const fetchAISummary = async () => {
            if (totalAmount === 0 || !coupleId) return;
            setLoadingAI(true);
            try {
                const summary = await getReportSummary(expenses);
                setAiSummary(summary);
            } catch (error) {
                console.error('Failed to fetch AI summary:', error);
            } finally {
                setLoadingAI(false);
            }
        };

        const fetchAdvice = async () => {
            if (totalAmount === 0 || !coupleId) return;
            setLoadingAdvice(true);
            try {
                const advice = await getSpendingAdvice(expenses);
                setSpendingAdvice(advice);
            } catch (error) {
                console.error('Failed to fetch spending advice:', error);
            } finally {
                setLoadingAdvice(false);
            }
        };

        const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        if (totalAmount > 0) {
            fetchAISummary();
            fetchAdvice();
        }
    }, [expenses, coupleId]);

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString();
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome name="arrow-left" size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>📊 月次レポート</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Selector */}
                <View style={styles.periodSelector}>
                    <TouchableOpacity
                        style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
                        onPress={() => setSelectedPeriod('month')}
                    >
                        <Text style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}>月次</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.periodButton, selectedPeriod === 'year' && styles.periodButtonActive]}
                        onPress={() => setSelectedPeriod('year')}
                    >
                        <Text style={[styles.periodText, selectedPeriod === 'year' && styles.periodTextActive]}>年次</Text>
                    </TouchableOpacity>
                </View>

                {/* Month Selector */}
                <View style={styles.monthSelector}>
                    <TouchableOpacity
                        style={styles.monthNavButton}
                        onPress={() => {
                            if (selectedMonth <= 1) {
                                setSelectedMonth(12);
                                setSelectedYear((y) => y - 1);
                            } else {
                                setSelectedMonth((m) => m - 1);
                            }
                        }}
                    >
                        <FontAwesome name="chevron-left" size={18} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={styles.monthSelectorLabel}>{data.month}</Text>
                    <TouchableOpacity
                        style={styles.monthNavButton}
                        onPress={() => {
                            const now = new Date();
                            const currentYear = now.getFullYear();
                            const currentMonth = now.getMonth() + 1;
                            if (selectedYear > currentYear || (selectedYear === currentYear && selectedMonth >= currentMonth)) return;
                            if (selectedMonth >= 12) {
                                setSelectedMonth(1);
                                setSelectedYear((y) => y + 1);
                            } else {
                                setSelectedMonth((m) => m + 1);
                            }
                        }}
                    >
                        <FontAwesome name="chevron-right" size={18} color={theme.text} />
                    </TouchableOpacity>
                </View>

                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryMonth}>{selectedYear}年 {data.month}の合計</Text>
                    <Text style={styles.summaryTotal}>¥{formatCurrency(data.total)}</Text>
                    <View style={styles.comparisonRow}>
                        <FontAwesome
                            name={data.comparison < 0 ? 'arrow-down' : 'arrow-up'}
                            size={14}
                            color={data.comparison < 0 ? theme.success : theme.error}
                        />
                        <Text style={[
                            styles.comparisonText,
                            { color: data.comparison < 0 ? theme.success : theme.error }
                        ]}>
                            先月比 ¥{formatCurrency(Math.abs(data.comparison))}
                        </Text>
                    </View>

                    {/* AI Analysis */}
                    <View style={styles.aiSummaryBox}>
                        <Text style={styles.aiSummaryLabel}>🤖 AI分析</Text>
                        {loadingAI ? (
                            <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 8 }} />
                        ) : (
                            <Text style={styles.aiSummaryText}>
                                {aiSummary || 'データを分析すると、ここに二人の生活へのアドバイスが表示されます。'}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Category Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📁 カテゴリ別</Text>
                    <View style={styles.categoryCard}>
                        {data.byCategory.map((cat, index) => (
                            <View key={index} style={styles.categoryRow}>
                                <View style={styles.categoryInfo}>
                                    <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                                    <Text style={styles.categoryName}>{cat.name}</Text>
                                </View>
                                <View style={styles.categoryBarContainer}>
                                    <View
                                        style={[
                                            styles.categoryBar,
                                            {
                                                width: `${(cat.amount / data.maxCatAmount) * 100}%`,
                                                backgroundColor: cat.color
                                            }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.categoryAmount}>¥{formatCurrency(cat.amount)}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Person Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👤 誰が払った？</Text>
                    <View style={styles.personCard}>
                        <View style={styles.personRow}>
                            <View style={styles.personInfo}>
                                <View style={[styles.personAvatar, { backgroundColor: theme.primary + '15' }]}>
                                    <Text>👤</Text>
                                </View>
                                <View>
                                    <Text style={styles.personName}>あなた</Text>
                                    <Text style={styles.personAmount}>¥{formatCurrency(data.byPerson.you.amount)}</Text>
                                </View>
                            </View>
                            <Text style={styles.personPercentage}>{data.byPerson.you.percentage}%</Text>
                        </View>

                        {/* Balance Bar */}
                        <View style={styles.balanceBar}>
                            <View style={[styles.balanceSegment, { flex: data.byPerson.you.percentage, backgroundColor: theme.primary }]} />
                            <View style={[styles.balanceSegment, { flex: data.byPerson.partner.percentage, backgroundColor: theme.secondary }]} />
                        </View>

                        <View style={styles.personRow}>
                            <View style={styles.personInfo}>
                                <View style={[styles.personAvatar, { backgroundColor: theme.secondary + '15' }]}>
                                    <Text>💑</Text>
                                </View>
                                <View>
                                    <Text style={styles.personName}>パートナー</Text>
                                    <Text style={styles.personAmount}>¥{formatCurrency(data.byPerson.partner.amount)}</Text>
                                </View>
                            </View>
                            <Text style={styles.personPercentage}>{data.byPerson.partner.percentage}%</Text>
                        </View>
                    </View>
                </View>

                {/* Chores Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🧹 家事分担</Text>
                    <View style={styles.choresCard}>
                        <View style={styles.choresRow}>
                            <View style={styles.choresStat}>
                                <Text style={styles.choresNumber}>{data.chores.you}</Text>
                                <Text style={styles.choresLabel}>あなた</Text>
                            </View>
                            <View style={styles.choresVs}>
                                <Text style={styles.choresVsText}>vs</Text>
                            </View>
                            <View style={styles.choresStat}>
                                <Text style={styles.choresNumber}>{data.chores.partner}</Text>
                                <Text style={styles.choresLabel}>パートナー</Text>
                            </View>
                        </View>
                        <View style={styles.choresBalance}>
                            <View style={[styles.choresBar, { flex: data.chores.you, backgroundColor: theme.primary }]} />
                            <View style={[styles.choresBar, { flex: data.chores.partner, backgroundColor: theme.secondary }]} />
                        </View>
                        <Text style={styles.choresTotalText}>今月合計 {data.chores.total} タスク完了 🎉</Text>
                    </View>
                </View>

                {/* Monthly Trend */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📈 支出推移</Text>
                    <View style={styles.trendCard}>
                        <BarGraph data={data.monthlyTrend} maxValue={maxTrendValue} />
                    </View>
                    {loadingAdvice && (
                        <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 12 }} />
                    )}
                    {!loadingAdvice && spendingAdvice ? (
                        <View style={styles.adviceCard}>
                            <Text style={styles.adviceLabel}>💡 AIアドバイス</Text>
                            <Text style={styles.adviceText}>{spendingAdvice}</Text>
                        </View>
                    ) : null}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
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
        paddingTop: 60,
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
    periodSelector: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 4,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    periodButtonActive: {
        backgroundColor: theme.primary,
    },
    periodText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.textSecondary,
    },
    periodTextActive: {
        color: '#fff',
    },
    monthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        marginBottom: 12,
        paddingHorizontal: 8,
    },
    monthNavButton: {
        padding: 12,
    },
    monthSelectorLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.text,
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
    summaryMonth: {
        fontSize: 14,
        color: theme.textSecondary,
        marginBottom: 4,
    },
    summaryTotal: {
        fontSize: 36,
        fontWeight: '700',
        color: theme.text,
    },
    comparisonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 6,
    },
    comparisonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    aiSummaryBox: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: theme.divider,
        width: '100%',
    },
    aiSummaryLabel: {
        fontSize: 12,
        color: theme.textSecondary,
        marginBottom: 6,
    },
    aiSummaryText: {
        fontSize: 14,
        color: theme.text,
        lineHeight: 22,
    },
    section: {
        marginTop: 24,
        marginHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 12,
    },
    categoryCard: {
        backgroundColor: theme.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: isDark ? 1 : 0,
        borderColor: theme.border,
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 80,
    },
    categoryDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    categoryName: {
        fontSize: 13,
        color: theme.textSecondary,
    },
    categoryBarContainer: {
        flex: 1,
        height: 8,
        backgroundColor: theme.backgroundSecondary,
        borderRadius: 4,
        marginHorizontal: 12,
    },
    categoryBar: {
        height: 8,
        borderRadius: 4,
    },
    categoryAmount: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.text,
        width: 80,
        textAlign: 'right',
    },
    personCard: {
        backgroundColor: theme.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: isDark ? 1 : 0,
        borderColor: theme.border,
    },
    personRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    personInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    personAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    personName: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    personAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
    },
    personPercentage: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
    },
    balanceBar: {
        flexDirection: 'row',
        height: 8,
        borderRadius: 4,
        marginVertical: 16,
        overflow: 'hidden',
    },
    balanceSegment: {
        height: '100%',
    },
    choresCard: {
        backgroundColor: theme.card,
        borderRadius: 16,
        padding: 20,
        borderWidth: isDark ? 1 : 0,
        borderColor: theme.border,
    },
    choresRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 32,
    },
    choresStat: {
        alignItems: 'center',
    },
    choresNumber: {
        fontSize: 36,
        fontWeight: '700',
        color: theme.success,
    },
    choresLabel: {
        fontSize: 13,
        color: theme.textSecondary,
        marginTop: 4,
    },
    choresVs: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    choresVsText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.textMuted,
    },
    choresBalance: {
        flexDirection: 'row',
        height: 8,
        borderRadius: 4,
        marginTop: 20,
        marginBottom: 12,
        overflow: 'hidden',
    },
    choresBar: {
        height: '100%',
    },
    choresTotalText: {
        textAlign: 'center',
        fontSize: 13,
        color: theme.textSecondary,
    },
    trendCard: {
        backgroundColor: theme.card,
        borderRadius: 16,
        padding: 20,
        borderWidth: isDark ? 1 : 0,
        borderColor: theme.border,
    },
    adviceCard: {
        backgroundColor: theme.info + '15',
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
    },
    adviceLabel: {
        fontSize: 12,
        color: theme.info,
        marginBottom: 6,
        fontWeight: '600',
    },
    adviceText: {
        fontSize: 14,
        color: theme.text,
        lineHeight: 20,
    },
    barGraph: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 120,
    },
    barItem: {
        alignItems: 'center',
    },
    barContainer: {
        width: 40,
        height: 100,
        justifyContent: 'flex-end',
    },
    bar: {
        width: '100%',
        borderRadius: 4,
    },
    barLabel: {
        fontSize: 12,
        color: theme.textSecondary,
        marginTop: 8,
    },
});
