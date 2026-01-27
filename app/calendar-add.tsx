import { useAddCalendarEvent } from '@/lib/queries';
import { useAuthStore } from '@/stores/authStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const CATEGORIES = [
    { id: 'date', label: 'デート', emoji: '❤️', color: '#4ECDC4' },
    { id: 'anniversary', label: '記念日', emoji: '💕', color: '#FF6B9D' },
    { id: 'payment', label: '支払い', emoji: '💰', color: '#FFB347' },
    { id: 'task', label: 'タスク', emoji: '📋', color: '#9B59B6' },
    { id: 'other', label: 'その他', emoji: '📌', color: '#95A5A6' },
];

export default function CalendarAddScreen() {
    const { profile } = useAuthStore();
    const addEvent = useAddCalendarEvent();
    const [title, setTitle] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('date');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [memo, setMemo] = useState('');
    const [hasReminder, setHasReminder] = useState(true);

    const formatDate = (date: Date) => `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;

    const handleSave = async () => {
        if (!title.trim() || !profile?.couple_id) {
            Alert.alert('エラー', 'タイトルを入力してください');
            return;
        }
        const dateStr = selectedDate.toISOString().slice(0, 10);
        try {
            await addEvent.mutateAsync({
                couple_id: profile.couple_id,
                title: title.trim(),
                date: dateStr,
                category: selectedCategory,
                reminder: hasReminder,
                notes: memo.trim() || null,
                created_by: profile.id,
            });
            router.back();
        } catch (e: any) {
            Alert.alert('エラー', e?.message ?? '保存に失敗しました');
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
                    <Text style={styles.cancelText}>キャンセル</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>予定を追加</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    style={[styles.saveButton, (!title || addEvent.isPending) && styles.saveButtonDisabled]}
                    disabled={!title || addEvent.isPending}
                >
                    <Text style={[styles.saveText, !title && styles.saveTextDisabled]}>{addEvent.isPending ? '保存中...' : '保存'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Title Input */}
                <View style={styles.section}>
                    <Text style={styles.label}>タイトル</Text>
                    <TextInput
                        style={styles.titleInput}
                        placeholder="予定のタイトルを入力"
                        placeholderTextColor="#ccc"
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                {/* Category Selection */}
                <View style={styles.section}>
                    <Text style={styles.label}>カテゴリ</Text>
                    <View style={styles.categoryGrid}>
                        {CATEGORIES.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                style={[
                                    styles.categoryItem,
                                    selectedCategory === category.id && {
                                        backgroundColor: category.color + '20',
                                        borderColor: category.color,
                                    },
                                ]}
                                onPress={() => setSelectedCategory(category.id)}
                            >
                                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                                <Text style={[
                                    styles.categoryLabel,
                                    selectedCategory === category.id && { color: category.color },
                                ]}>
                                    {category.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Date Selection */}
                <View style={styles.section}>
                    <Text style={styles.label}>日付</Text>
                    <TouchableOpacity style={styles.dateButton}>
                        <FontAwesome name="calendar" size={18} color="#FF6B9D" />
                        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
                        <FontAwesome name="chevron-right" size={14} color="#ccc" />
                    </TouchableOpacity>
                </View>

                {/* Time Selection */}
                <View style={styles.section}>
                    <Text style={styles.label}>時間（任意）</Text>
                    <TouchableOpacity style={styles.dateButton}>
                        <FontAwesome name="clock-o" size={18} color="#4ECDC4" />
                        <Text style={styles.dateText}>終日</Text>
                        <FontAwesome name="chevron-right" size={14} color="#ccc" />
                    </TouchableOpacity>
                </View>

                {/* Reminder Toggle */}
                <View style={styles.section}>
                    <View style={styles.toggleRow}>
                        <View style={styles.toggleInfo}>
                            <FontAwesome name="bell" size={18} color="#FFB347" />
                            <Text style={styles.toggleLabel}>リマインダー</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.toggle, hasReminder && styles.toggleActive]}
                            onPress={() => setHasReminder(!hasReminder)}
                        >
                            <View style={[styles.toggleKnob, hasReminder && styles.toggleKnobActive]} />
                        </TouchableOpacity>
                    </View>
                    {hasReminder && (
                        <Text style={styles.reminderNote}>当日の朝9時に通知されます</Text>
                    )}
                </View>

                {/* Memo */}
                <View style={styles.section}>
                    <Text style={styles.label}>メモ（任意）</Text>
                    <TextInput
                        style={styles.memoInput}
                        placeholder="メモを追加..."
                        placeholderTextColor="#ccc"
                        value={memo}
                        onChangeText={setMemo}
                        multiline
                        numberOfLines={4}
                    />
                </View>

                {/* Share Info */}
                <View style={styles.shareInfo}>
                    <FontAwesome name="users" size={16} color="#FF6B9D" />
                    <Text style={styles.shareText}>
                        この予定はパートナーと共有されます
                    </Text>
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
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    cancelButton: {
        padding: 8,
    },
    cancelText: {
        fontSize: 16,
        color: '#666',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#333',
    },
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FF6B9D',
        borderRadius: 20,
    },
    saveButtonDisabled: {
        backgroundColor: '#fcc',
    },
    saveText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    saveTextDisabled: {
        color: '#fff8',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    titleInput: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        fontSize: 17,
        color: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: 'transparent',
        gap: 6,
    },
    categoryEmoji: {
        fontSize: 16,
    },
    categoryLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    dateText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
    },
    toggleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    toggleLabel: {
        fontSize: 16,
        color: '#333',
    },
    toggle: {
        width: 50,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#ddd',
        padding: 2,
    },
    toggleActive: {
        backgroundColor: '#4ECDC4',
    },
    toggleKnob: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    toggleKnobActive: {
        transform: [{ translateX: 20 }],
    },
    reminderNote: {
        fontSize: 12,
        color: '#999',
        marginTop: 8,
        marginLeft: 4,
    },
    memoInput: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#333',
        minHeight: 100,
        textAlignVertical: 'top',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    shareInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
    },
    shareText: {
        fontSize: 13,
        color: '#999',
    },
});
