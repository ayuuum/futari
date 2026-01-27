import { ThemeColors } from '@/constants/themes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/stores/authStore';
import { useSavingsGoal, useSavingsLogs, useSavingsMutations } from '@/lib/queries';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SavingsDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const goalId = id ?? '';
    const { theme } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { profile, partner } = useAuthStore();
    const { data: goal, isLoading: goalLoading } = useSavingsGoal(goalId);
    const { data: logs = [] } = useSavingsLogs(goalId);
    const { addLog } = useSavingsMutations();

    const [showDepositInput, setShowDepositInput] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    const [depositNote, setDepositNote] = useState('');

    const myId = profile?.id ?? '';
    const userName = (uid: string) => (uid === myId ? 'あなた' : (partner?.display_name ?? 'パートナー'));

    const progress = goal && goal.target_amount > 0 ? Math.min(goal.current_amount / goal.target_amount, 1) : 0;
    const percentage = Math.round(progress * 100);
    const goalColor = goal?.color ?? '#FF6B9D';
    const goalEmoji = goal?.emoji ?? '🎯';

    const formatCurrency = (amount: number) => amount.toLocaleString('ja-JP');

    const handleDeposit = async () => {
        const amount = parseInt(depositAmount.replace(/\D/g, ''), 10);
        if (!goalId || !myId || isNaN(amount) || amount <= 0) {
            Alert.alert('エラー', '有効な金額を入力してください');
            return;
        }
        try {
            await addLog.mutateAsync({ goal_id: goalId, user_id: myId, amount, note: depositNote.trim() || null });
            setShowDepositInput(false);
            setDepositAmount('');
            setDepositNote('');
        } catch (e: any) {
            Alert.alert('エラー', e?.message ?? '追加に失敗しました');
        }
    };

    if (goalLoading || !goal) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                {goalLoading ? <ActivityIndicator size="large" color={theme.primary} /> : <Text style={{ color: theme.textSecondary }}>見つかりません</Text>}
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome name="arrow-left" size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>詳細</Text>
                <TouchableOpacity style={styles.editButton}>
                    <FontAwesome name="ellipsis-h" size={20} color={theme.textMuted} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.heroSection}>
                    <View style={[styles.emojiBox, { backgroundColor: goalColor + '15' }]}>
                        <Text style={styles.heroEmoji}>{goalEmoji}</Text>
                    </View>
                    <Text style={styles.heroTitle}>{goal.title}</Text>
                    <Text style={styles.heroDescription}>目標まで貯金を続けましょう</Text>
                </View>

                <View style={styles.progressCard}>
                    <View style={styles.progressInfo}>
                        <View>
                            <Text style={styles.progressLabel}>現在の貯金額</Text>
                            <Text style={[styles.progressCurrent, { color: goalColor }]}>
                                {formatCurrency(goal.current_amount)}
                                <Text style={styles.progressUnit}> 円</Text>
                            </Text>
                        </View>
                        <View style={styles.percentageBadge}>
                            <Text style={[styles.percentageText, { color: goalColor }]}>{percentage}%</Text>
                        </View>
                    </View>
                    <View style={styles.progressBarContainer}>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { backgroundColor: goalColor, width: `${percentage}%` }]} />
                        </View>
                        <View style={styles.milestones}>
                            <View style={[styles.milestone, { left: '25%' }]} />
                            <View style={[styles.milestone, { left: '50%' }]} />
                            <View style={[styles.milestone, { left: '75%' }]} />
                        </View>
                    </View>
                    <View style={styles.targetRow}>
                        <Text style={styles.targetLabel}>目標: {formatCurrency(goal.target_amount)}円</Text>
                        <Text style={styles.remainingLabel}>あと {formatCurrency(goal.target_amount - goal.current_amount)}円</Text>
                    </View>
                </View>

                {!showDepositInput ? (
                    <TouchableOpacity
                        style={[styles.depositTrigger, { backgroundColor: goalColor }]}
                        onPress={() => setShowDepositInput(true)}
                    >
                        <FontAwesome name="plus-circle" size={20} color="#fff" />
                        <Text style={styles.depositTriggerText}>貯金を追加する</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.depositForm}>
                        <Text style={styles.formLabel}>いくら貯金しますか？</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[styles.amountInput, { color: theme.text }]}
                                placeholder="0"
                                placeholderTextColor={theme.textMuted}
                                keyboardType="numeric"
                                value={depositAmount}
                                onChangeText={setDepositAmount}
                                autoFocus
                            />
                            <Text style={styles.inputUnit}>円</Text>
                        </View>
                        <TextInput
                            style={[styles.noteInput, { borderBottomColor: theme.border, color: theme.text }]}
                            placeholder="メモ（任意）"
                            placeholderTextColor={theme.textMuted}
                            value={depositNote}
                            onChangeText={setDepositNote}
                        />
                        <View style={styles.formButtons}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowDepositInput(false)}>
                                <Text style={[styles.cancelButtonText, { color: theme.textMuted }]}>キャンセル</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.submitButton, { backgroundColor: goalColor }]}
                                onPress={handleDeposit}
                                disabled={addLog.isPending}
                            >
                                <Text style={styles.submitButtonText}>入金する</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <View style={styles.historySection}>
                    <Text style={styles.historyTitle}>入金履歴</Text>
                    {logs.length === 0 ? (
                        <Text style={[styles.logNote, { paddingVertical: 12 }]}>まだ入金履歴はありません</Text>
                    ) : (
                        logs.map((log) => {
                            const name = userName(log.user_id);
                            return (
                                <View key={log.id} style={styles.logItem}>
                                    <View style={[styles.logAvatar, { backgroundColor: log.user_id === myId ? theme.primary + '40' : theme.secondary }]}>
                                        <Text style={styles.logAvatarText}>{name[0]}</Text>
                                    </View>
                                    <View style={styles.logInfo}>
                                        <View style={styles.logMainRow}>
                                            <Text style={styles.logUser}>{name}</Text>
                                            <Text style={styles.logAmount}>+{formatCurrency(log.amount)}円</Text>
                                        </View>
                                        <View style={styles.logSubRow}>
                                            <Text style={styles.logNote}>{log.note || '貯金'}</Text>
                                            <Text style={styles.logDate}>{new Date(log.created_at).toLocaleDateString('ja-JP')}</Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
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
            fontSize: 18,
            fontWeight: '600',
            color: theme.text,
        },
        editButton: {
            padding: 8,
        },
        scrollContent: {
            paddingHorizontal: 20,
            paddingBottom: 40,
        },
        heroSection: {
            alignItems: 'center',
            marginTop: 20,
            marginBottom: 30,
        },
        emojiBox: {
            width: 80,
            height: 80,
            borderRadius: 24,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
        },
        heroEmoji: {
            fontSize: 40,
        },
        heroTitle: {
            fontSize: 24,
            fontWeight: '800',
            color: theme.text,
            marginBottom: 8,
        },
        heroDescription: {
            fontSize: 14,
            color: theme.textSecondary,
            textAlign: 'center',
            lineHeight: 20,
            paddingHorizontal: 20,
        },
        progressCard: {
            backgroundColor: theme.card,
            borderRadius: 24,
            padding: 24,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 15,
            elevation: 5,
        },
        progressInfo: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
        },
        progressLabel: {
            fontSize: 13,
            color: theme.textSecondary,
            marginBottom: 4,
        },
        progressCurrent: {
            fontSize: 28,
            fontWeight: '800',
        },
        progressUnit: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.textMuted,
        },
        percentageBadge: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
            backgroundColor: theme.backgroundSecondary,
        },
        percentageText: {
            fontSize: 18,
            fontWeight: '800',
        },
        progressBarContainer: {
            marginBottom: 12,
            position: 'relative',
        },
        progressBarBg: {
            height: 14,
            backgroundColor: theme.backgroundSecondary,
            borderRadius: 7,
            overflow: 'hidden',
        },
        progressBarFill: {
            height: '100%',
            borderRadius: 7,
        },
        milestones: {
            ...StyleSheet.absoluteFillObject,
            flexDirection: 'row',
        },
        milestone: {
            position: 'absolute',
            width: 2,
            height: 14,
            backgroundColor: theme.card,
            opacity: 0.5,
        },
        targetRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        targetLabel: {
            fontSize: 12,
            color: theme.textMuted,
        },
        remainingLabel: {
            fontSize: 12,
            fontWeight: '600',
            color: theme.textSecondary,
        },
        depositTrigger: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: 56,
            borderRadius: 16,
            gap: 10,
            marginBottom: 30,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 5,
        },
        depositTriggerText: {
            fontSize: 16,
            fontWeight: '700',
            color: '#fff',
        },
        depositForm: {
            backgroundColor: theme.card,
            borderRadius: 20,
            padding: 20,
            marginBottom: 30,
            borderWidth: 1,
            borderColor: theme.divider,
        },
        formLabel: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.textSecondary,
            marginBottom: 16,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'center',
            marginBottom: 16,
        },
        amountInput: {
            fontSize: 36,
            fontWeight: '800',
            textAlign: 'center',
            minWidth: 100,
        },
        inputUnit: {
            fontSize: 18,
            fontWeight: '600',
            color: theme.textMuted,
            marginLeft: 4,
        },
        noteInput: {
            height: 44,
            borderBottomWidth: 1,
            fontSize: 15,
            marginBottom: 20,
        },
        formButtons: {
            flexDirection: 'row',
            gap: 12,
        },
        cancelButton: {
            flex: 1,
            height: 48,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 12,
            backgroundColor: theme.backgroundSecondary,
        },
        cancelButtonText: {
            fontWeight: '600',
        },
        submitButton: {
            flex: 2,
            height: 48,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 12,
        },
        submitButtonText: {
            color: '#fff',
            fontWeight: '700',
            fontSize: 15,
        },
        historySection: {
            marginTop: 10,
        },
        historyTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.text,
            marginBottom: 16,
        },
        logItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.divider,
        },
        logAvatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
        },
        logAvatarText: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#fff',
        },
        logInfo: {
            flex: 1,
            marginLeft: 16,
        },
        logMainRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 2,
        },
        logUser: {
            fontSize: 15,
            fontWeight: '600',
            color: theme.text,
        },
        logAmount: {
            fontSize: 16,
            fontWeight: '700',
            color: theme.success,
        },
        logSubRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        logNote: {
            fontSize: 13,
            color: theme.textSecondary,
        },
        logDate: {
            fontSize: 12,
            color: theme.textMuted,
        },
    });
