import { ThemeColors } from '@/constants/themes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCouple } from '@/lib/queries';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

export default function SplitSettingsScreen() {
    const { theme, isDark } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { profile } = useAuthStore();
    const coupleId = profile?.couple_id ?? null;
    const { data: couple } = useCouple(coupleId);
    const qc = useQueryClient();

    const [expenseSplit, setExpenseSplit] = useState(50);
    const [choreSplit, setChoreSplit] = useState(50);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (couple != null) {
            setExpenseSplit(couple.expense_ratio_me ?? 50);
        }
    }, [couple]);

    const handleSave = async () => {
        if (!coupleId) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('couples')
                .update({
                    expense_ratio_me: expenseSplit,
                    expense_ratio_partner: 100 - expenseSplit,
                })
                .eq('id', coupleId);
            if (error) throw error;
            qc.invalidateQueries({ queryKey: ['couple', coupleId] });
            router.back();
        } catch (e: any) {
            Alert.alert('エラー', e?.message ?? '保存に失敗しました');
        }
        setSaving(false);
    };

    const renderSplitUI = (
        title: string,
        value: number,
        setValue: (v: number) => void,
        icon: string
    ) => (
        <View style={styles.splitCard}>
            <View style={styles.splitHeader}>
                <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                    <FontAwesome name={icon as any} size={20} color={theme.primary} />
                </View>
                <Text style={styles.splitTitle}>{title}</Text>
            </View>

            <View style={styles.ratioContainer}>
                <View style={styles.ratioItem}>
                    <Text style={styles.ratioLabel}>あなた</Text>
                    <Text style={styles.ratioValue}>{value}%</Text>
                </View>
                <View style={styles.ratioDivider}>
                    <Text style={styles.dividerText}>:</Text>
                </View>
                <View style={styles.ratioItem}>
                    <Text style={styles.ratioLabel}>パートナー</Text>
                    <Text style={styles.ratioValue}>{100 - value}%</Text>
                </View>
            </View>

            <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={5}
                value={value}
                onValueChange={setValue}
                minimumTrackTintColor={theme.primary}
                maximumTrackTintColor={theme.backgroundSecondary}
                thumbTintColor={theme.primary}
            />

            <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>0%</Text>
                <Text style={styles.sliderLabel}>50:50</Text>
                <Text style={styles.sliderLabel}>100%</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome name="arrow-left" size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>負担割合の設定</Text>
                <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={saving}>
                    <Text style={[styles.saveButtonText, { color: theme.primary }]}>{saving ? '保存中...' : '保存'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.explanation}>
                    <Text style={styles.explanationText}>
                        共通の支出や家事分担の「デフォルトの割合」を設定します。個別に入力する際の初期値として使用されます。
                    </Text>
                </View>

                {renderSplitUI('生活費・共通支出', expenseSplit, setExpenseSplit, 'money')}
                {renderSplitUI('家事・タスク', choreSplit, setChoreSplit, 'tasks')}

                <View style={styles.tipBox}>
                    <FontAwesome name="lightbulb-o" size={18} color={theme.warning} />
                    <Text style={styles.tipText}>
                        収入に応じて 7:3 にしたり、家賃は 6:4 にするなど、お二人の状況に合わせて調整しましょう。
                    </Text>
                </View>
            </ScrollView>
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
            backgroundColor: theme.card,
        },
        backButton: {
            padding: 8,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.text,
        },
        saveButton: {
            padding: 8,
        },
        saveButtonText: {
            fontSize: 16,
            fontWeight: '600',
        },
        content: {
            flex: 1,
            padding: 16,
        },
        explanation: {
            marginBottom: 24,
            paddingHorizontal: 8,
        },
        explanationText: {
            fontSize: 14,
            color: theme.textSecondary,
            lineHeight: 22,
        },
        splitCard: {
            backgroundColor: theme.card,
            borderRadius: 20,
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
            borderWidth: isDark ? 1 : 0,
            borderColor: theme.border,
        },
        splitHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
        },
        iconContainer: {
            width: 36,
            height: 36,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
        },
        splitTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: theme.text,
        },
        ratioContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
        },
        ratioItem: {
            alignItems: 'center',
            flex: 1,
        },
        ratioLabel: {
            fontSize: 12,
            color: theme.textSecondary,
            marginBottom: 4,
        },
        ratioValue: {
            fontSize: 28,
            fontWeight: '800',
            color: theme.text,
        },
        ratioDivider: {
            paddingHorizontal: 16,
        },
        dividerText: {
            fontSize: 24,
            fontWeight: '300',
            color: theme.textMuted,
        },
        slider: {
            width: '100%',
            height: 40,
        },
        sliderLabels: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 10,
        },
        sliderLabel: {
            fontSize: 11,
            color: theme.textMuted,
        },
        tipBox: {
            flexDirection: 'row',
            backgroundColor: theme.backgroundSecondary,
            padding: 16,
            borderRadius: 12,
            gap: 12,
            marginTop: 8,
        },
        tipText: {
            flex: 1,
            fontSize: 13,
            color: theme.textSecondary,
            lineHeight: 18,
        },
    });
