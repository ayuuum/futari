import { ThemeColors } from '@/constants/themes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useSavingsGoals } from '@/lib/queries';
import { useAuthStore } from '@/stores/authStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, router } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SavingsScreen() {
    const { theme } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { profile } = useAuthStore();
    const coupleId = profile?.couple_id ?? null;
    const { data: goals = [], isLoading } = useSavingsGoals(coupleId);

    const getDaysRemaining = (deadline: string | null) => {
        if (!deadline) return 0;
        const today = new Date();
        const target = new Date(deadline);
        const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const formatCurrency = (amount: number) => amount.toLocaleString('ja-JP');

    const renderGoalCard = ({ item }: { item: (typeof goals)[0] }) => {
        const progress = item.target_amount > 0 ? Math.min(item.current_amount / item.target_amount, 1) : 0;
        const percentage = Math.round(progress * 100);
        const color = item.color ?? '#FF6B9D';
        const emoji = item.emoji ?? '🎯';

        return (
            <Link href={`/savings/${item.id}`} asChild>
                <TouchableOpacity style={styles.goalCard}>
                    <View style={styles.goalHeader}>
                        <View style={[styles.emojiContainer, { backgroundColor: color + '15' }]}>
                            <Text style={styles.goalEmoji}>{emoji}</Text>
                        </View>
                        <View style={styles.goalInfo}>
                            <Text style={styles.goalTitle}>{item.title}</Text>
                            <Text style={styles.goalDeadline}>
                                期限: {item.deadline ?? '未定'} (あと{getDaysRemaining(item.deadline)}日)
                            </Text>
                        </View>
                        <FontAwesome name="chevron-right" size={14} color={theme.textMuted} />
                    </View>
                    <View style={styles.progressSection}>
                        <View style={styles.progressLabelRow}>
                            <Text style={styles.progressText}>
                                <Text style={[styles.currentAmount, { color }]}>{formatCurrency(item.current_amount)}</Text>
                                <Text style={styles.targetAmount}> / {formatCurrency(item.target_amount)}円</Text>
                            </Text>
                            <Text style={[styles.percentageText, { color }]}>{percentage}%</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { backgroundColor: color, width: `${percentage}%` }]} />
                        </View>
                    </View>
                    <View style={styles.footerRow}>
                        <Text style={styles.remainingText}>あと {formatCurrency(item.target_amount - item.current_amount)}円</Text>
                        <View style={styles.avatars}>
                            <View style={[styles.avatar, { backgroundColor: theme.primary + '30' }]}>
                                <Text style={styles.avatarText}>ME</Text>
                            </View>
                            <View style={[styles.avatar, { backgroundColor: theme.secondary, marginLeft: -8 }]}>
                                <Text style={styles.avatarText}>P</Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </Link>
        );
    };

    if (!coupleId && profile) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
                <Text style={{ color: theme.textSecondary }}>パートナーと連携すると貯金目標を管理できます</Text>
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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome name="arrow-left" size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>💰 共同貯金</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={goals}
                renderItem={renderGoalCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>合計貯金額</Text>
                        <Text style={styles.summaryAmount}>
                            {formatCurrency(goals.reduce((sum, g) => sum + g.current_amount, 0))}
                            <Text style={styles.summaryUnit}>円</Text>
                        </Text>
                        <View style={styles.summaryDivider} />
                        <Text style={styles.summarySubtext}>二人の夢に向かって順調に進んでいます！✨</Text>
                    </View>
                }
            />

            <Link href="/savings/add-goal" asChild>
                <TouchableOpacity style={StyleSheet.flatten([styles.fab, { backgroundColor: theme.primary }])}>
                    <FontAwesome name="plus" size={24} color="#fff" />
                </TouchableOpacity>
            </Link>
        </View>
    );
}

const createStyles = (theme: ThemeColors, isDark: boolean) =>
    StyleSheet.create({
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
        },
        backButton: {
            padding: 8,
        },
        headerTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: theme.text,
        },
        listContent: {
            padding: 16,
            paddingBottom: 100,
        },
        summaryCard: {
            backgroundColor: theme.card,
            borderRadius: 20,
            padding: 24,
            marginBottom: 24,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 12,
            elevation: 5,
        },
        summaryLabel: {
            fontSize: 14,
            color: theme.textSecondary,
            marginBottom: 8,
        },
        summaryAmount: {
            fontSize: 32,
            fontWeight: '800',
            color: theme.text,
        },
        summaryUnit: {
            fontSize: 16,
            fontWeight: '600',
            marginLeft: 4,
        },
        summaryDivider: {
            width: '40%',
            height: 1,
            backgroundColor: theme.divider,
            marginVertical: 16,
        },
        summarySubtext: {
            fontSize: 13,
            color: theme.textSecondary,
            textAlign: 'center',
        },
        goalCard: {
            backgroundColor: theme.card,
            borderRadius: 18,
            padding: 20,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.03,
            shadowRadius: 8,
            elevation: 3,
        },
        goalHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
        },
        emojiContainer: {
            width: 48,
            height: 48,
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
        },
        goalEmoji: {
            fontSize: 24,
        },
        goalInfo: {
            flex: 1,
            marginLeft: 16,
        },
        goalTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.text,
            marginBottom: 4,
        },
        goalDeadline: {
            fontSize: 12,
            color: theme.textMuted,
        },
        progressSection: {
            marginBottom: 16,
        },
        progressLabelRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 8,
        },
        progressText: {
            fontSize: 14,
        },
        currentAmount: {
            fontWeight: '700',
            fontSize: 18,
        },
        targetAmount: {
            color: theme.textMuted,
            fontSize: 14,
        },
        percentageText: {
            fontSize: 16,
            fontWeight: '700',
        },
        progressBarBg: {
            height: 10,
            backgroundColor: theme.backgroundSecondary,
            borderRadius: 5,
            overflow: 'hidden',
        },
        progressBarFill: {
            height: '100%',
            borderRadius: 5,
        },
        footerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        remainingText: {
            fontSize: 14,
            color: theme.textSecondary,
            fontWeight: '500',
        },
        avatars: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        avatar: {
            width: 28,
            height: 28,
            borderRadius: 14,
            borderWidth: 2,
            borderColor: theme.card,
            justifyContent: 'center',
            alignItems: 'center',
        },
        avatarText: {
            fontSize: 10,
            fontWeight: 'bold',
            color: '#fff',
        },
        fab: {
            position: 'absolute',
            right: 20,
            bottom: Platform.OS === 'ios' ? 40 : 20,
            width: 60,
            height: 60,
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
        },
    });
