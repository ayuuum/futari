import { useTheme } from '@/contexts/ThemeContext';
import { scanReceipt, type CategoryId } from '@/lib/ai';
import { useAddExpensesBulk } from '@/lib/queries';
import { useAuthStore } from '@/stores/authStore';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const categories: { id: CategoryId; name: string; emoji: string }[] = [
    { id: 'food', name: '食費', emoji: '🍽️' },
    { id: 'utilities', name: '光熱費', emoji: '💡' },
    { id: 'rent', name: '家賃', emoji: '🏠' },
    { id: 'entertainment', name: '娯楽', emoji: '🎮' },
    { id: 'daily', name: '日用品', emoji: '🧴' },
    { id: 'transport', name: '交通費', emoji: '🚃' },
    { id: 'medical', name: '医療費', emoji: '💊' },
    { id: 'other', name: 'その他', emoji: '📦' },
];

type ReceiptStatus = 'pending' | 'processing' | 'done' | 'error';

type ReceiptDraft = {
    id: string;
    uri: string;
    status: ReceiptStatus;
    error?: string;
    amount: string;
    description: string;
    categoryId: CategoryId;
    date: string;
    selected: boolean;
};

function categoryName(id: CategoryId) {
    return categories.find((c) => c.id === id)?.name ?? 'その他';
}

function makeId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function BulkReceiptsScreen() {
    const { theme } = useTheme();
    const { profile } = useAuthStore();
    const addBulk = useAddExpensesBulk();
    const [drafts, setDrafts] = useState<ReceiptDraft[]>([]);
    const [phase, setPhase] = useState<'select' | 'processing' | 'review'>('select');
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const processingRef = useRef(false);

    const updateDraft = useCallback((id: string, patch: Partial<ReceiptDraft>) => {
        setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    }, []);

    const processReceipts = useCallback(async (items: ReceiptDraft[]) => {
        if (processingRef.current) return;
        processingRef.current = true;
        setPhase('processing');
        setProgress({ current: 0, total: items.length });

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            setProgress({ current: i + 1, total: items.length });
            updateDraft(item.id, { status: 'processing', error: undefined });

            try {
                const base64 = await FileSystem.readAsStringAsync(item.uri, { encoding: 'base64' } as any);
                const parsed = await scanReceipt(base64);
                updateDraft(item.id, {
                    status: 'done',
                    amount: String(parsed.amount),
                    description: parsed.description,
                    categoryId: parsed.categoryId,
                    date: parsed.date,
                    selected: parsed.amount > 0,
                });
            } catch (e: any) {
                updateDraft(item.id, {
                    status: 'error',
                    error: e?.message ?? '読み取りに失敗しました',
                    selected: false,
                });
            }
        }

        processingRef.current = false;
        setPhase('review');
    }, [updateDraft]);

    const pickImages = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('権限', '写真ライブラリへのアクセスを許可してください。');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            base64: false,
            allowsMultipleSelection: true,
            selectionLimit: 30,
        });

        if (result.canceled || !result.assets?.length) return;

        const today = new Date().toISOString().slice(0, 10);
        const newDrafts: ReceiptDraft[] = result.assets.map((asset) => ({
            id: makeId(),
            uri: asset.uri,
            status: 'pending' as const,
            amount: '',
            description: '',
            categoryId: 'other' as CategoryId,
            date: today,
            selected: true,
        }));

        setDrafts((prev) => [...prev, ...newDrafts]);
        await processReceipts(newDrafts);
    };

    const retryItem = async (item: ReceiptDraft) => {
        updateDraft(item.id, { status: 'processing', error: undefined });
        try {
            const base64 = await FileSystem.readAsStringAsync(item.uri, { encoding: 'base64' } as any);
            const parsed = await scanReceipt(base64);
            updateDraft(item.id, {
                status: 'done',
                amount: String(parsed.amount),
                description: parsed.description,
                categoryId: parsed.categoryId,
                date: parsed.date,
                selected: parsed.amount > 0,
            });
        } catch (e: any) {
            updateDraft(item.id, {
                status: 'error',
                error: e?.message ?? '読み取りに失敗しました',
                selected: false,
            });
        }
    };

    const handleSaveAll = async () => {
        if (!profile?.couple_id) return;

        const toSave = drafts.filter((d) => {
            if (!d.selected || d.status !== 'done') return false;
            const amt = parseInt(d.amount.replace(/\D/g, ''), 10);
            return !isNaN(amt) && amt > 0 && d.description.trim();
        });

        if (toSave.length === 0) {
            Alert.alert('エラー', '登録できるレシートがありません。金額と内容を確認してください。');
            return;
        }

        try {
            await addBulk.mutateAsync(
                toSave.map((d) => ({
                    couple_id: profile.couple_id!,
                    paid_by: profile.id,
                    amount: parseInt(d.amount.replace(/\D/g, ''), 10),
                    category: categoryName(d.categoryId),
                    description: d.description.trim(),
                    date: d.date,
                    is_shared: true,
                }))
            );

            if (Platform.OS === 'web') {
                router.replace('/(tabs)/expenses');
            } else {
                Alert.alert('完了', `${toSave.length}件の支出を登録しました！`, [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            }
        } catch (e: any) {
            Alert.alert('エラー', e?.message ?? '保存に失敗しました');
        }
    };

    const selectedCount = drafts.filter((d) => d.selected && d.status === 'done').length;
    const selectedTotal = drafts
        .filter((d) => d.selected && d.status === 'done')
        .reduce((sum, d) => sum + (parseInt(d.amount.replace(/\D/g, ''), 10) || 0), 0);

    const renderReviewItem = ({ item }: { item: ReceiptDraft }) => (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => updateDraft(item.id, { selected: !item.selected })}
            >
                <View style={[styles.checkbox, item.selected && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                    {item.selected && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                    {item.status === 'error' ? '読み取り失敗' : item.description || 'レシート'}
                </Text>
                {item.status === 'error' && (
                    <TouchableOpacity onPress={() => retryItem(item)} style={styles.retryButton}>
                        <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '600' }}>再試行</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>

            {item.status === 'error' && (
                <Text style={[styles.errorText, { color: theme.error }]}>{item.error}</Text>
            )}

            {item.status === 'done' && (
                <View style={styles.cardBody}>
                    <View style={styles.fieldRow}>
                        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>金額</Text>
                        <TextInput
                            style={[styles.fieldInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                            value={item.amount}
                            onChangeText={(v) => updateDraft(item.id, { amount: v })}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={theme.textMuted}
                        />
                    </View>
                    <View style={styles.fieldRow}>
                        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>内容</Text>
                        <TextInput
                            style={[styles.fieldInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                            value={item.description}
                            onChangeText={(v) => updateDraft(item.id, { description: v })}
                            placeholder="店名"
                            placeholderTextColor={theme.textMuted}
                        />
                    </View>
                    <View style={styles.fieldRow}>
                        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>日付</Text>
                        <TextInput
                            style={[styles.fieldInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                            value={item.date}
                            onChangeText={(v) => updateDraft(item.id, { date: v })}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={theme.textMuted}
                        />
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryChip,
                                    { backgroundColor: theme.background },
                                    item.categoryId === cat.id && { backgroundColor: theme.primary },
                                ]}
                                onPress={() => updateDraft(item.id, { categoryId: cat.id })}
                            >
                                <Text style={[styles.categoryChipText, item.categoryId === cat.id && { color: '#fff' }]}>
                                    {cat.emoji} {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'レシートまとめ登録',
                    headerStyle: { backgroundColor: theme.background },
                    headerShadowVisible: false,
                }}
            />
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {phase === 'select' && (
                    <View style={styles.centerContent}>
                        <Text style={styles.heroEmoji}>📸</Text>
                        <Text style={[styles.heroTitle, { color: theme.text }]}>月末レシートをまとめて登録</Text>
                        <Text style={[styles.heroDesc, { color: theme.textSecondary }]}>
                            カメラロールからレシート写真を複数枚選ぶと、AIが金額・店名・カテゴリ・日付を読み取ります。確認してから一括登録できます。
                        </Text>
                        <TouchableOpacity
                            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                            onPress={pickImages}
                            testID="pick-receipts-button"
                        >
                            <Text style={styles.primaryButtonText}>レシートを選択</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {phase === 'processing' && (
                    <View style={styles.centerContent}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={[styles.processingText, { color: theme.text }]}>
                            読み取り中... {progress.current}/{progress.total}
                        </Text>
                        <Text style={[styles.processingSub, { color: theme.textSecondary }]}>
                            1枚ずつAIで解析しています
                        </Text>
                    </View>
                )}

                {phase === 'review' && (
                    <>
                        <View style={[styles.summaryBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                            <Text style={[styles.summaryText, { color: theme.text }]}>
                                {selectedCount}件選択中　合計 ¥{selectedTotal.toLocaleString('ja-JP')}
                            </Text>
                            <TouchableOpacity onPress={pickImages}>
                                <Text style={{ color: theme.primary, fontWeight: '600' }}>追加</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={drafts}
                            renderItem={renderReviewItem}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                        <View style={[styles.bottomBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                            <TouchableOpacity
                                style={[styles.primaryButton, { backgroundColor: theme.primary }, addBulk.isPending && styles.buttonDisabled]}
                                onPress={handleSaveAll}
                                disabled={addBulk.isPending || selectedCount === 0}
                                testID="save-all-button"
                            >
                                {addBulk.isPending ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>{selectedCount}件をまとめて登録</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    heroEmoji: {
        fontSize: 56,
        marginBottom: 16,
    },
    heroTitle: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
    },
    heroDesc: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    primaryButton: {
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 32,
        alignItems: 'center',
        minWidth: 200,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    processingText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 20,
    },
    processingSub: {
        fontSize: 14,
        marginTop: 8,
    },
    summaryBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    summaryText: {
        fontSize: 15,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#ccc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkmark: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    cardTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
    },
    retryButton: {
        padding: 4,
    },
    errorText: {
        fontSize: 13,
        marginTop: 8,
        marginLeft: 36,
    },
    cardBody: {
        marginTop: 12,
        marginLeft: 36,
        gap: 8,
    },
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    fieldLabel: {
        width: 40,
        fontSize: 13,
    },
    fieldInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 15,
    },
    categoryScroll: {
        marginTop: 4,
    },
    categoryChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
    },
    categoryChipText: {
        fontSize: 12,
        color: '#666',
    },
    bottomBar: {
        padding: 16,
        borderTopWidth: 1,
    },
});
