import { ThemeColors } from '@/constants/themes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useShoppingItems, useShoppingMutations } from '@/lib/queries';
import { useAuthStore } from '@/stores/authStore';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ShoppingScreen() {
    const { theme } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { profile } = useAuthStore();
    const coupleId = profile?.couple_id ?? null;
    const myId = profile?.id ?? '';
    const { data: items = [], isLoading } = useShoppingItems(coupleId);
    const { add, update, remove } = useShoppingMutations();
    const [newItemName, setNewItemName] = useState('');
    const [showCompleted, setShowCompleted] = useState(true);

    const toggleItem = async (id: string, current: boolean) => {
        try {
            await update.mutateAsync({ id, is_purchased: !current, purchased_by: !current ? myId : null });
        } catch (_) { }
    };

    const addItem = async () => {
        if (!newItemName.trim() || !coupleId) return;
        try {
            await add.mutateAsync({
                couple_id: coupleId,
                name: newItemName.trim(),
                category: 'その他',
                estimated_price: null,
                is_purchased: false,
            });
            setNewItemName('');
        } catch (_) {
            Alert.alert('エラー', '追加に失敗しました');
        }
    };

    const deleteItem = (id: string) => {
        Alert.alert('削除', 'このアイテムを削除しますか？', [
            { text: 'キャンセル', style: 'cancel' },
            { text: '削除', style: 'destructive', onPress: () => remove.mutate(id) },
        ]);
    };

    const pendingItems = items.filter((item) => !item.is_purchased);
    const purchasedItems = items.filter((item) => item.is_purchased);
    const totalEstimate = pendingItems.reduce((sum, item) => sum + (item.estimated_price ?? 0), 0);

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('ja-JP');
    };

    const getCategoryColor = (category: string | null) => {
        if (!category) return theme.textSecondary;
        switch (category) {
            case '日用品': return '#9B59B6';
            case '食品': return '#6BCB77';
            case '生活家電': return '#3498DB';
            default: return theme.textSecondary;
        }
    };

    const renderItem = (item: (typeof items)[0]) => (
        <TouchableOpacity
            key={item.id}
            style={[styles.itemCard, item.is_purchased && styles.itemCardPurchased]}
            onPress={() => toggleItem(item.id, item.is_purchased)}
            onLongPress={() => deleteItem(item.id)}
            activeOpacity={0.7}
            testID="shopping-item"
        >
            <View style={styles.itemLeft}>
                <View
                    style={[
                        styles.checkbox,
                        item.is_purchased && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                >
                    {item.is_purchased && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.itemInfo}>
                    <Text
                        style={[
                            styles.itemName,
                            item.is_purchased && styles.itemNamePurchased,
                        ]}
                    >
                        {item.name}
                    </Text>
                    {(item.category ?? '') && (
                        <View style={styles.itemMeta}>
                            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
                                <Text style={styles.categoryText}>{item.category}</Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>
            {(item.estimated_price ?? 0) > 0 && (
                <Text
                    style={[
                        styles.itemPrice,
                        item.is_purchased && styles.itemPricePurchased,
                    ]}
                >
                    ¥{formatCurrency(item.estimated_price ?? 0)}
                </Text>
            )}
        </TouchableOpacity>
    );

    if (!coupleId && profile) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
                <Text style={{ color: theme.textSecondary }}>パートナーと連携すると買い物リストを使えます</Text>
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
            {/* Add Item Input */}
            <View style={styles.inputSection}>
                <TextInput
                    style={styles.input}
                    placeholder="アイテムを追加..."
                    placeholderTextColor={theme.textSecondary}
                    value={newItemName}
                    onChangeText={setNewItemName}
                    onSubmitEditing={addItem}
                    returnKeyType="done"
                    testID="shopping-input"
                />
                <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.secondary }]} onPress={addItem}>
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            </View>

            {/* Summary */}
            <View style={styles.summarySection}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryNumber}>{pendingItems.length}</Text>
                    <Text style={styles.summaryLabel}>未購入</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryNumber}>¥{formatCurrency(totalEstimate)}</Text>
                    <Text style={styles.summaryLabel}>予想合計</Text>
                </View>
            </View>

            <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                {/* Pending Items */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🛒 買い物リスト</Text>
                    {pendingItems.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyEmoji}>✅</Text>
                            <Text style={styles.emptyText}>すべて購入済みです！</Text>
                        </View>
                    ) : (
                        pendingItems.map(item => renderItem(item))
                    )}
                </View>

                {/* Purchased Items */}
                {showCompleted && purchasedItems.length > 0 && (
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.sectionHeader}
                            onPress={() => setShowCompleted(!showCompleted)}
                        >
                            <Text style={styles.sectionTitleMuted}>
                                ✓ 購入済み ({purchasedItems.length})
                            </Text>
                        </TouchableOpacity>
                        {purchasedItems.map(item => renderItem(item))}
                    </View>
                )}

                {!showCompleted && purchasedItems.length > 0 && (
                    <TouchableOpacity
                        style={styles.showCompletedButton}
                        onPress={() => setShowCompleted(true)}
                    >
                        <Text style={styles.showCompletedText}>
                            購入済み ({purchasedItems.length}件) を表示
                        </Text>
                    </TouchableOpacity>
                )}

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
    inputSection: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        backgroundColor: theme.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    input: {
        flex: 1,
        backgroundColor: isDark ? '#333' : '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: theme.text,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '300',
    },
    summarySection: {
        flexDirection: 'row',
        backgroundColor: theme.card,
        paddingVertical: 16,
        marginBottom: 8,
        justifyContent: 'center',
    },
    summaryItem: {
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    summaryNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.text,
    },
    summaryLabel: {
        fontSize: 12,
        color: theme.textSecondary,
        marginTop: 4,
    },
    summaryDivider: {
        width: 1,
        backgroundColor: theme.border,
    },
    listContainer: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    sectionHeader: {
        paddingVertical: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 12,
    },
    sectionTitleMuted: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.textSecondary,
        marginBottom: 8,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
        borderWidth: isDark ? 1 : 0,
        borderColor: theme.border,
    },
    itemCardPurchased: {
        backgroundColor: isDark ? '#222' : '#f9f9f9',
    },
    itemLeft: {
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
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '500',
        color: theme.text,
        marginBottom: 4,
    },
    itemNamePurchased: {
        color: theme.textSecondary,
        textDecorationLine: 'line-through',
    },
    itemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    categoryText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.text,
    },
    itemPricePurchased: {
        color: theme.textSecondary,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        color: theme.textSecondary,
    },
    showCompletedButton: {
        alignItems: 'center',
        paddingVertical: 12,
        marginHorizontal: 16,
    },
    showCompletedText: {
        color: theme.textSecondary,
        fontSize: 14,
    },
});
