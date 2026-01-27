import { useAnniversaries, useAnniversaryMutations } from '@/lib/queries';
import { useAuthStore } from '@/stores/authStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
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

const EMOJI_OPTIONS = ['💕', '❤️', '🏠', '🎂', '💍', '🎉', '✈️', '🌸', '⭐', '🎁'];

export default function AnniversariesScreen() {
    const { profile } = useAuthStore();
    const coupleId = profile?.couple_id ?? null;
    const { data: anniversariesData = [] } = useAnniversaries(coupleId);
    const { add, remove } = useAnniversaryMutations();
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAnniversary, setNewAnniversary] = useState({
        title: '',
        date: '',
        emoji: '💕',
        isYearly: true,
    });

    const anniversaries = anniversariesData.map((a) => ({
        id: a.id,
        title: a.title,
        date: a.date,
        emoji: a.emoji ?? '💕',
        isYearly: a.is_yearly,
    }));

    const calculateDaysUntil = (dateStr: string, isYearly: boolean) => {
        const today = new Date();
        const dateParts = dateStr.split('-');
        let targetDate = new Date(
            isYearly ? today.getFullYear() : parseInt(dateParts[0]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[2])
        );

        // If the date has passed this year, use next year
        if (isYearly && targetDate < today) {
            targetDate.setFullYear(today.getFullYear() + 1);
        }

        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const calculateYearsSince = (dateStr: string) => {
        const today = new Date();
        const date = new Date(dateStr);
        const years = today.getFullYear() - date.getFullYear();
        return years;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}月${date.getDate()}日`;
    };

    const sortedAnniversaries = [...anniversaries].sort((a, b) => {
        return calculateDaysUntil(a.date, a.isYearly) - calculateDaysUntil(b.date, b.isYearly);
    });

    const upcomingAnniversary = sortedAnniversaries[0];

    const handleAddAnniversary = async () => {
        if (!newAnniversary.title || !newAnniversary.date || !coupleId) {
            Alert.alert('エラー', 'タイトルと日付を入力してください');
            return;
        }
        try {
            await add.mutateAsync({
                couple_id: coupleId,
                title: newAnniversary.title.trim(),
                date: newAnniversary.date,
                emoji: newAnniversary.emoji,
                is_yearly: newAnniversary.isYearly,
            });
            setShowAddModal(false);
            setNewAnniversary({ title: '', date: '', emoji: '💕', isYearly: true });
        } catch (e: any) {
            Alert.alert('エラー', e?.message ?? '追加に失敗しました');
        }
    };

    const deleteAnniversary = (id: string) => {
        Alert.alert('削除', 'この記念日を削除しますか？', [
            { text: 'キャンセル', style: 'cancel' },
            { text: '削除', style: 'destructive', onPress: () => remove.mutate(id) },
        ]);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome name="arrow-left" size={20} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>💕 記念日</Text>
                <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
                    <FontAwesome name="plus" size={18} color="#FF6B9D" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Countdown Card */}
                {upcomingAnniversary && (
                    <View style={styles.countdownCard}>
                        <Text style={styles.countdownEmoji}>{upcomingAnniversary.emoji}</Text>
                        <Text style={styles.countdownTitle}>{upcomingAnniversary.title}</Text>
                        <View style={styles.countdownDays}>
                            <Text style={styles.countdownNumber}>
                                {calculateDaysUntil(upcomingAnniversary.date, upcomingAnniversary.isYearly)}
                            </Text>
                            <Text style={styles.countdownLabel}>日後</Text>
                        </View>
                        <Text style={styles.countdownDate}>{formatDate(upcomingAnniversary.date)}</Text>
                        {upcomingAnniversary.isYearly && calculateYearsSince(upcomingAnniversary.date) > 0 && (
                            <View style={styles.yearBadge}>
                                <Text style={styles.yearBadgeText}>
                                    {calculateYearsSince(upcomingAnniversary.date) + 1}周年
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Anniversaries List */}
                <View style={styles.listSection}>
                    <Text style={styles.sectionTitle}>📅 すべての記念日</Text>

                    {sortedAnniversaries.map((anniversary) => {
                        const daysUntil = calculateDaysUntil(anniversary.date, anniversary.isYearly);
                        const years = calculateYearsSince(anniversary.date);

                        return (
                            <View key={anniversary.id} style={styles.anniversaryCard}>
                                <View style={styles.anniversaryEmoji}>
                                    <Text style={styles.emojiText}>{anniversary.emoji}</Text>
                                </View>
                                <View style={styles.anniversaryInfo}>
                                    <Text style={styles.anniversaryTitle}>{anniversary.title}</Text>
                                    <Text style={styles.anniversaryDate}>
                                        {formatDate(anniversary.date)}
                                        {anniversary.isYearly && years > 0 && ` (${years}周年)`}
                                    </Text>
                                </View>
                                <View style={styles.anniversaryRight}>
                                    {daysUntil === 0 ? (
                                        <View style={styles.todayBadge}>
                                            <Text style={styles.todayBadgeText}>今日！</Text>
                                        </View>
                                    ) : daysUntil <= 7 ? (
                                        <View style={styles.soonBadge}>
                                            <Text style={styles.soonBadgeText}>{daysUntil}日後</Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.daysText}>{daysUntil}日後</Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Tips */}
                <View style={styles.tipsSection}>
                    <View style={styles.tipCard}>
                        <Text style={styles.tipEmoji}>💡</Text>
                        <Text style={styles.tipText}>
                            記念日が近づくと通知でお知らせします
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
                            <Text style={styles.modalTitle}>記念日を追加</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <FontAwesome name="times" size={22} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalForm}>
                            {/* Emoji Selection */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>アイコン</Text>
                                <View style={styles.emojiGrid}>
                                    {EMOJI_OPTIONS.map((emoji) => (
                                        <TouchableOpacity
                                            key={emoji}
                                            style={[
                                                styles.emojiOption,
                                                newAnniversary.emoji === emoji && styles.emojiOptionSelected
                                            ]}
                                            onPress={() => setNewAnniversary({ ...newAnniversary, emoji })}
                                        >
                                            <Text style={styles.emojiOptionText}>{emoji}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>タイトル</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="例: 交際記念日"
                                    placeholderTextColor="#ccc"
                                    value={newAnniversary.title}
                                    onChangeText={(text) => setNewAnniversary({ ...newAnniversary, title: text })}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>日付（YYYY-MM-DD）</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="2024-06-15"
                                    placeholderTextColor="#ccc"
                                    value={newAnniversary.date}
                                    onChangeText={(text) => setNewAnniversary({ ...newAnniversary, date: text })}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.yearlyToggle}
                                onPress={() => setNewAnniversary({ ...newAnniversary, isYearly: !newAnniversary.isYearly })}
                            >
                                <FontAwesome
                                    name={newAnniversary.isYearly ? 'check-square' : 'square-o'}
                                    size={22}
                                    color={newAnniversary.isYearly ? '#FF6B9D' : '#ccc'}
                                />
                                <Text style={styles.yearlyToggleText}>毎年繰り返す</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveButton, (!newAnniversary.title || !newAnniversary.date) && styles.saveButtonDisabled]}
                            onPress={handleAddAnniversary}
                            disabled={!newAnniversary.title || !newAnniversary.date}
                        >
                            <Text style={styles.saveButtonText}>追加する</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF0F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    countdownCard: {
        backgroundColor: '#FF6B9D',
        marginHorizontal: 16,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#FF6B9D',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    countdownEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    countdownTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 16,
    },
    countdownDays: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    countdownNumber: {
        fontSize: 64,
        fontWeight: '800',
        color: '#fff',
    },
    countdownLabel: {
        fontSize: 24,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 8,
    },
    countdownDate: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.9,
    },
    yearBadge: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 16,
    },
    yearBadgeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FF6B9D',
    },
    listSection: {
        marginTop: 32,
        marginHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    anniversaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    anniversaryEmoji: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#FFF0F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emojiText: {
        fontSize: 22,
    },
    anniversaryInfo: {
        flex: 1,
        marginLeft: 12,
    },
    anniversaryTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    anniversaryDate: {
        fontSize: 13,
        color: '#999',
        marginTop: 2,
    },
    anniversaryRight: {
        alignItems: 'flex-end',
    },
    daysText: {
        fontSize: 14,
        color: '#999',
    },
    todayBadge: {
        backgroundColor: '#FF6B9D',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    todayBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    soonBadge: {
        backgroundColor: '#FFE4EC',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    soonBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FF6B9D',
    },
    tipsSection: {
        marginTop: 24,
        marginHorizontal: 16,
    },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF0F5',
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    tipEmoji: {
        fontSize: 20,
    },
    tipText: {
        flex: 1,
        fontSize: 14,
        color: '#666',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
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
        color: '#333',
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
        color: '#666',
    },
    formInput: {
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#333',
    },
    emojiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    emojiOption: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f8f8f8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emojiOptionSelected: {
        backgroundColor: '#FFE4EC',
        borderWidth: 2,
        borderColor: '#FF6B9D',
    },
    emojiOptionText: {
        fontSize: 22,
    },
    yearlyToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    yearlyToggleText: {
        fontSize: 16,
        color: '#333',
    },
    saveButton: {
        backgroundColor: '#FF6B9D',
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
