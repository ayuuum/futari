import { getReportSummary, getSpendingAdvice } from '@/lib/ai';
import { useAuthStore } from '@/stores/authStore';
import { useExpenses } from '@/lib/queries';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React, { useMemo, useState, useEffect } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useQueries } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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
                                    backgroundColor: index === data.length - 1 ? '#FF6B9D' : '#ddd',
                                }
                            ]}
                        />
                    </View>
                    <Text style={styles.barLabel}>{item.month}</Text>
                </View>
            ))}
        </View>
    );
}

export default function ReportScreen() {
    const { theme } = useTheme();
    const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year'>('month');
    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const { profile, partner } = useAuthStore();
    const coupleId = profile?.couple_id ?? null;
    const myId = profile?.id ?? '';
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

    const monthlyTrend = useMemo(() => {
        return trendMonths.map(({ year, month }, i) => {
            const list = trendQueries[i]?.data ?? [];
            const amount = list.reduce((s: number, r: { amount: number }) => s + r.amount, 0);
            return { month: MONTH_LABELS[month - 1], amount };
        });
    }, [trendMonths, trendQueries]);

    const prevMonthTotal = useMemo(() => {
        const prevM = selectedMonth === 1 ? 12 : selectedMonth - 1;
        const prevY = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
        const idx = trendMonths.findIndex((t) => t.year === prevY && t.month === prevM);
        if (idx < 0) return 0;
        const list = trendQueries[idx]?.data ?? [];
        return list.reduce((s: number, r: { amount: number }) => s + r.amount, 0);
    }, [selectedYear, selectedMonth, trendMonths, trendQueries]);

    const data = useMemo(() => {
        const total = expenses.reduce((s, e) => s + e.amount, 0);
        const byCat: Record<string, number> = {};
        expenses.forEach((e) => {
            byCat[e.category] = (byCat[e.category] ?? 0) + e.amount;
        });
        const byCategory = Object.entries(byCat).map(([name, amount]) => ({
            name,
            amount,
            percentage: total > 0 ? (amount / total) * 100 : 0,
            color: CATEGORY_COLORS[name] ?? '#95A5A6',
        }));
        byCategory.sort((a, b) => b.amount - a.amount);
        const myTotal = expenses.filter((e) => e.paid_by === myId).reduce((s, e) => s + e.amount, 0);
        const partnerTotal = total - myTotal;
        return {
            month: `${selectedYear}年${selectedMonth}月`,
            totalExpenses: total,
            comparison: total - prevMonthTotal,
            byCategory,
            byPerson: {
                you: { amount: myTotal, percentage: total > 0 ? Math.round((myTotal / total) * 100) : 0 },
                partner: { amount: partnerTotal, percentage: total > 0 ? Math.round((partnerTotal / total) * 100) : 0 },
            },
            chores: { you: 0, partner: 0, total: 0 },
            monthlyTrend,
        };
    }, [expenses, selectedYear, selectedMonth, myId, prevMonthTotal, monthlyTrend]);

    const maxTrendValue = data.monthlyTrend.length
        ? Math.max(1, ...data.monthlyTrend.map((t) => t.amount))
        : 1;
    const formatCurrency = (amount: number) => amount.toLocaleString('ja-JP');

    const [reportSummary, setReportSummary] = useState('');
    const [spendingAdvice, setSpendingAdvice] = useState('');
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [loadingAdvice, setLoadingAdvice] = useState(false);

    const summaryPayload = useMemo(
        () =>
            data.month
                ? {
                      month: data.month,
                      totalExpenses: data.totalExpenses,
                      comparison: data.comparison,
                      byCategory: data.byCategory.map((c) => ({ name: c.name, amount: c.amount, percentage: c.percentage })),
                      byPerson: data.byPerson,
                  }
                : null,
        [data.month, data.totalExpenses, data.comparison, data.byCategory, data.byPerson]
    );
    const advicePayload = useMemo(
        () =>
            data.monthlyTrend.length
                ? {
                      monthlyTrend: data.monthlyTrend,
                      byCategory: data.byCategory.map((c) => ({ name: c.name, amount: c.amount })),
                  }
                : null,
        [data.monthlyTrend, data.byCategory]
    );

    useEffect(() => {
        if (!summaryPayload || !coupleId) return;
        setLoadingSummary(true);
        getReportSummary(summaryPayload)
            .then(setReportSummary)
            .catch(() => setReportSummary(''))
            .finally(() => setLoadingSummary(false));
    }, [summaryPayload, coupleId]);

    useEffect(() => {
        if (!advicePayload || !coupleId) return;
        setLoadingAdvice(true);
        getSpendingAdvice(advicePayload)
            .then(setSpendingAdvice)
            .catch(() => setSpendingAdvice(''))
            .finally(() => setLoadingAdvice(false));
    }, [advicePayload, coupleId]);

    if (!coupleId && profile) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
                <Text style={{ color: theme.textSecondary }}>パートナーと連携するとレポートを表示できます</Text>
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
                    <FontAwesome name="arrow-left" size={20} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>📊 月次レポート</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Period Selector */}
                <View style={styles.periodSelector}>
                    <TouchableOpacity
                        style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
                        onPress={() => setSelectedPeriod('month')}
                    >
                        <Text style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}>
                            月間
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.periodButton, selectedPeriod === 'year' && styles.periodButtonActive]}
                        onPress={() => setSelectedPeriod('year')}
                    >
                        <Text style={[styles.periodText, selectedPeriod === 'year' && styles.periodTextActive]}>
                            年間
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Month selector */}
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
                        <FontAwesome name="chevron-left" size={18} color="#333" />
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
                        <FontAwesome name="chevron-right" size={18} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryMonth}>{data.month}</Text>
                    <Text style={styles.summaryTotal}>¥{formatCurrency(data.totalExpenses)}</Text>
                    <View style={styles.comparisonRow}>
                        <FontAwesome
                            name={data.comparison < 0 ? 'arrow-down' : 'arrow-up'}
                            size={14}
                            color={data.comparison < 0 ? '#4ECDC4' : '#E74C3C'}
                        />
                        <Text style={[
                            styles.comparisonText,
                            { color: data.comparison < 0 ? '#4ECDC4' : '#E74C3C' }
                        ]}>
                            先月比 ¥{formatCurrency(Math.abs(data.comparison))}
                        </Text>
                    </View>
                    {loadingSummary && (
                        <Text style={[styles.summaryMonth, { marginTop: 12 }]}>AIサマリー生成中...</Text>
                    )}
                    {!loadingSummary && reportSummary ? (
                        <View style={styles.aiSummaryBox}>
                            <Text style={styles.aiSummaryLabel}>AIサマリー</Text>
                            <Text style={styles.aiSummaryText}>{reportSummary}</Text>
                        </View>
                    ) : null}
                </View>

                {/* Category Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💰 カテゴリ別支出</Text>
                    <View style={styles.categoryCard}>
                        {/* Horizontal Bar Chart */}
                        {data.byCategory.map((category, index) => (
                            <View key={index} style={styles.categoryRow}>
                                <View style={styles.categoryInfo}>
                                    <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                                    <Text style={styles.categoryName}>{category.name}</Text>
                                </View>
                                <View style={styles.categoryBarContainer}>
                                    <View
                                        style={[
                                            styles.categoryBar,
                                            {
                                                width: `${category.percentage}%`,
                                                backgroundColor: category.color,
                                            }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.categoryAmount}>¥{formatCurrency(category.amount)}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Person Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👫 負担割合</Text>
                    <View style={styles.personCard}>
                        <View style={styles.personRow}>
                            <View style={styles.personInfo}>
                                <View style={[styles.personAvatar, { backgroundColor: '#FFE4EC' }]}>
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
                            <View style={[styles.balanceSegment, { flex: data.byPerson.you.percentage, backgroundColor: '#FF6B9D' }]} />
                            <View style={[styles.balanceSegment, { flex: data.byPerson.partner.percentage, backgroundColor: '#4ECDC4' }]} />
                        </View>

                        <View style={styles.personRow}>
                            <View style={styles.personInfo}>
                                <View style={[styles.personAvatar, { backgroundColor: '#E0F7F5' }]}>
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
                            <View style={[styles.choresBar, { flex: data.chores.you, backgroundColor: '#FF6B9D' }]} />
                            <View style={[styles.choresBar, { flex: data.chores.partner, backgroundColor: '#4ECDC4' }]} />
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
                        <Text style={[styles.sectionTitle, { marginTop: 12, fontSize: 14 }]}>アドバイス生成中...</Text>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF9F0',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#FFF9F0',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    periodSelector: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: '#fff',
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
        backgroundColor: '#FF6B9D',
    },
    periodText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#999',
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
        color: '#333',
    },
    summaryCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    summaryMonth: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    summaryTotal: {
        fontSize: 36,
        fontWeight: '700',
        color: '#333',
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
        borderTopColor: '#f0f0f0',
    },
    aiSummaryLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 6,
    },
    aiSummaryText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 22,
    },
    section: {
        marginTop: 24,
        marginHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    categoryCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
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
        color: '#666',
    },
    categoryBarContainer: {
        flex: 1,
        height: 8,
        backgroundColor: '#f0f0f0',
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
        color: '#333',
        width: 80,
        textAlign: 'right',
    },
    personCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
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
        color: '#666',
    },
    personAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    personPercentage: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
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
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
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
        color: '#4ECDC4',
    },
    choresLabel: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },
    choresVs: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    choresVsText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#999',
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
        color: '#666',
    },
    trendCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
    },
    adviceCard: {
        backgroundColor: '#E8F8F5',
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
    },
    adviceLabel: {
        fontSize: 12,
        color: '#2C7A6B',
        marginBottom: 6,
        fontWeight: '600',
    },
    adviceText: {
        fontSize: 14,
        color: '#333',
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
        color: '#666',
        marginTop: 8,
    },
});
