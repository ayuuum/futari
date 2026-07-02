import { useTheme } from '@/contexts/ThemeContext';
import { parseExpenseFromText, scanReceipt, suggestCategory, type CategoryId } from '@/lib/ai';
import { useAddExpense, useCouple } from '@/lib/queries';
import { useAuthStore } from '@/stores/authStore';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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

const categories = [
    { id: 'food', name: '食費', emoji: '🍽️' },
    { id: 'utilities', name: '光熱費', emoji: '💡' },
    { id: 'rent', name: '家賃', emoji: '🏠' },
    { id: 'entertainment', name: '娯楽', emoji: '🎮' },
    { id: 'daily', name: '日用品', emoji: '🧴' },
    { id: 'transport', name: '交通費', emoji: '🚃' },
    { id: 'medical', name: '医療費', emoji: '💊' },
    { id: 'other', name: 'その他', emoji: '📦' },
];

export default function AddExpenseScreen() {
    const { theme } = useTheme();
    const { profile } = useAuthStore();
    const addExpense = useAddExpense();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('food');
    const [isShared, setIsShared] = useState(true);
    const [scanningReceipt, setScanningReceipt] = useState(false);
    const [suggestingCategory, setSuggestingCategory] = useState(false);
    const [parsingText, setParsingText] = useState(false);
    const [quickInput, setQuickInput] = useState('');
    const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
    const { data: couple } = useCouple(profile?.couple_id ?? null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const text = description.trim();
        if (text.length < 2) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            debounceRef.current = null;
            setSuggestingCategory(true);
            try {
                const categoryId = await suggestCategory(text);
                setSelectedCategory(categoryId);
            } catch (_) {
                // ignore: keep current selection
            }
            setSuggestingCategory(false);
        }, 500);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [description]);

    const handleSubmit = async () => {
        if (!amount || !description) {
            Alert.alert('エラー', '金額と内容を入力してください');
            return;
        }
        const amt = parseInt(amount.replace(/\D/g, ''), 10);
        if (isNaN(amt) || amt <= 0) {
            Alert.alert('エラー', '有効な金額を入力してください');
            return;
        }
        if (!profile) return;
        const categoryName = categories.find((c) => c.id === selectedCategory)?.name ?? 'その他';
        try {
            await addExpense.mutateAsync({
                couple_id: profile.couple_id!,
                paid_by: profile.id,
                amount: amt,
                category: categoryName,
                description: description.trim() || null,
                date: entryDate,
                is_shared: isShared,
            });
            // Web では Alert.alert の onPress が動かないため、先に画面遷移する
            if (Platform.OS === 'web') {
                router.replace('/(tabs)/expenses');
            } else {
                Alert.alert('完了', '支出を記録しました！', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            }
        } catch (e: any) {
            Alert.alert('エラー', e?.message ?? '保存に失敗しました');
        }
    };

    const loading = addExpense.isPending;

    const handleScanReceipt = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('権限', '写真ライブラリへのアクセスを許可してください。');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            base64: false,
        });
        if (result.canceled || !result.assets?.[0]?.uri) return;
        setScanningReceipt(true);
        try {
            const uri = result.assets[0].uri;
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            } as any);
            const parsed = await scanReceipt(base64);
            setAmount(String(parsed.amount));
            setDescription(parsed.description);
            setSelectedCategory(parsed.categoryId as CategoryId);
            setEntryDate(parsed.date);
        } catch (e: any) {
            Alert.alert('AI機能', e?.message ?? 'レシートの読み取りに失敗しました。');
        }
        setScanningReceipt(false);
    };

    const handleQuickParse = async () => {
        const text = quickInput.trim();
        if (!text) return;
        setParsingText(true);
        try {
            const parsed = await parseExpenseFromText(text);
            setAmount(String(parsed.amount));
            setDescription(parsed.description);
            setSelectedCategory(parsed.categoryId);
            setEntryDate(parsed.date);
            setQuickInput('');
        } catch (e: any) {
            Alert.alert('AI機能', e?.message ?? '入力の解析に失敗しました。');
        }
        setParsingText(false);
    };

    return (
        <>
            <Stack.Screen
                options={{
                    title: '支出を追加',
                    headerStyle: { backgroundColor: '#FFF9F0' },
                    headerShadowVisible: false,
                }}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Amount Input */}
                    <View style={styles.amountSection}>
                        <Text style={styles.currencySymbol}>¥</Text>
                        <TextInput
                            style={styles.amountInput}
                            placeholder="0"
                            placeholderTextColor={theme.textMuted}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Quick text input */}
                    <View style={[styles.inputGroup, { marginBottom: 16 }]}>
                        <Text style={styles.label}>一言で入力（AIで解析）</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TextInput
                                style={[styles.textInput, { flex: 1 }]}
                                placeholder="例: 昨日コンビニで500円"
                                placeholderTextColor={theme.textMuted}
                                value={quickInput}
                                onChangeText={setQuickInput}
                            />
                            <TouchableOpacity
                                style={[styles.quickParseButton, parsingText && styles.quickParseButtonDisabled]}
                                onPress={handleQuickParse}
                                disabled={parsingText || !quickInput.trim()}
                            >
                                {parsingText ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.quickParseButtonText}>解析</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                        {entryDate !== new Date().toISOString().slice(0, 10) && (
                            <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                                日付: {entryDate}（保存時に使用）
                            </Text>
                        )}
                    </View>

                    {/* AI Receipt Scan Button */}
                    <TouchableOpacity
                        style={styles.scanButton}
                        onPress={handleScanReceipt}
                        disabled={scanningReceipt}
                    >
                        {scanningReceipt ? (
                            <ActivityIndicator size="small" color="#4ECDC4" style={{ marginRight: 8 }} />
                        ) : (
                            <Text style={styles.scanButtonEmoji}>📸</Text>
                        )}
                        <Text style={styles.scanButtonText}>
                            {scanningReceipt ? '読み取り中...' : 'レシートをスキャン'}
                        </Text>
                        <View style={styles.aiBadge}>
                            <Text style={styles.aiBadgeText}>AI</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Description Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>内容</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="例：スーパーマーケット"
                            placeholderTextColor={theme.textMuted}
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>

                    {/* Category Selection */}
                    <View style={styles.inputGroup}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={styles.label}>カテゴリ</Text>
                            {suggestingCategory && (
                                <Text style={{ fontSize: 12, color: '#4ECDC4', marginLeft: 8 }}>AIで提案中...</Text>
                            )}
                        </View>
                        <View style={styles.categoryGrid}>
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.categoryItem,
                                        selectedCategory === cat.id && styles.categoryItemActive,
                                    ]}
                                    onPress={() => setSelectedCategory(cat.id)}
                                >
                                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                                    <Text
                                        style={[
                                            styles.categoryName,
                                            selectedCategory === cat.id && styles.categoryNameActive,
                                        ]}
                                    >
                                        {cat.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Shared Toggle */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>共有設定</Text>
                        <View style={styles.toggleRow}>
                            <TouchableOpacity
                                style={[styles.toggleOption, isShared && styles.toggleOptionActive]}
                                onPress={() => setIsShared(true)}
                            >
                                <Text style={styles.toggleEmoji}>👥</Text>
                                <Text style={[styles.toggleText, isShared && styles.toggleTextActive]}>
                                    二人で共有
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toggleOption, !isShared && styles.toggleOptionActive]}
                                onPress={() => setIsShared(false)}
                            >
                                <Text style={styles.toggleEmoji}>👤</Text>
                                <Text style={[styles.toggleText, !isShared && styles.toggleTextActive]}>
                                    個人の支出
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Submit Button */}
                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>支出を記録</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF9F0',
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    amountSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
    },
    currencySymbol: {
        fontSize: 32,
        color: '#999',
        marginRight: 8,
    },
    amountInput: {
        fontSize: 48,
        fontWeight: '700',
        color: '#333',
        minWidth: 100,
        textAlign: 'center',
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#4ECDC4',
        borderStyle: 'dashed',
    },
    scanButtonEmoji: {
        fontSize: 24,
        marginRight: 8,
    },
    scanButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4ECDC4',
    },
    aiBadge: {
        backgroundColor: '#4ECDC4',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 8,
    },
    aiBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        minWidth: '23%',
    },
    categoryItemActive: {
        borderColor: '#FF6B9D',
        backgroundColor: '#FFF0F5',
    },
    categoryEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    categoryName: {
        fontSize: 12,
        color: '#666',
    },
    categoryNameActive: {
        color: '#FF6B9D',
        fontWeight: '600',
    },
    toggleRow: {
        flexDirection: 'row',
        gap: 12,
    },
    toggleOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        gap: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    toggleOptionActive: {
        borderColor: '#FF6B9D',
        backgroundColor: '#FFF0F5',
    },
    toggleEmoji: {
        fontSize: 20,
    },
    toggleText: {
        fontSize: 14,
        color: '#666',
    },
    toggleTextActive: {
        color: '#FF6B9D',
        fontWeight: '600',
    },
    bottomBar: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    submitButton: {
        backgroundColor: '#FF6B9D',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    quickParseButton: {
        backgroundColor: '#4ECDC4',
        borderRadius: 12,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 72,
    },
    quickParseButtonDisabled: {
        opacity: 0.7,
    },
    quickParseButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
