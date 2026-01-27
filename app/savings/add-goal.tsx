import { ThemeColors } from '@/constants/themes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useSavingsMutations } from '@/lib/queries';
import { useAuthStore } from '@/stores/authStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
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

const EMOJIS = ['✈️', '🏠', '💍', '🚗', '👶', '💻', '🍱', '🎁', '🛋️', '🎨', '👔', '🔋'];
const COLORS = ['#FF6B9D', '#4A90D9', '#9B59B6', '#4ECDC4', '#FFB347', '#E74C3C', '#95A5A6'];

export default function AddSavingsGoalScreen() {
    const { theme } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { profile } = useAuthStore();
    const { addGoal } = useSavingsMutations();

    const [title, setTitle] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [deadline, setDeadline] = useState('');
    const [description, setDescription] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0]);
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);

    const handleCreate = async () => {
        if (!profile?.couple_id) {
            Alert.alert('エラー', 'パートナーと連携してください');
            return;
        }
        const amount = parseInt(targetAmount.replace(/\D/g, ''), 10);
        if (!title || isNaN(amount) || amount <= 0 || !deadline) {
            Alert.alert('エラー', 'タイトル・目標金額・期日を入力してください');
            return;
        }
        try {
            await addGoal.mutateAsync({
                couple_id: profile.couple_id,
                title: title.trim(),
                target_amount: amount,
                deadline: deadline || null,
                emoji: selectedEmoji,
                color: selectedColor,
            });
            router.back();
        } catch (e: any) {
            Alert.alert('エラー', e?.message ?? '作成に失敗しました');
        }
    };

    const isFormValid = !!title.trim() && !!targetAmount && !!deadline;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome name="times" size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>新しい目標</Text>
                <TouchableOpacity
                    onPress={handleCreate}
                    disabled={!isFormValid || addGoal.isPending}
                    style={[styles.createButton, { opacity: isFormValid && !addGoal.isPending ? 1 : 0.5 }]}
                >
                    {addGoal.isPending ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                        <Text style={[styles.createButtonText, { color: theme.primary }]}>作成</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Emoji & Title Section */}
                <View style={styles.mainInputSection}>
                    <TouchableOpacity
                        style={[styles.emojiPicker, { backgroundColor: selectedColor + '15', borderColor: selectedColor }]}
                    >
                        <Text style={styles.selectedEmoji}>{selectedEmoji}</Text>
                        <View style={[styles.editBadge, { backgroundColor: selectedColor }]}>
                            <FontAwesome name="pencil" size={10} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <TextInput
                        style={[styles.titleInput, { color: theme.text }]}
                        placeholder="目標のタイトル"
                        placeholderTextColor={theme.textMuted}
                        value={title}
                        onChangeText={setTitle}
                        autoFocus
                    />
                </View>

                {/* Amount & Deadline */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>目標金額</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundSecondary }]}>
                        <FontAwesome name="yen" size={14} color={theme.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="0"
                            placeholderTextColor={theme.textMuted}
                            keyboardType="numeric"
                            value={targetAmount}
                            onChangeText={setTargetAmount}
                        />
                        <Text style={styles.inputUnit}>円</Text>
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>目標期日</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundSecondary }]}>
                        <FontAwesome name="calendar" size={14} color={theme.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={theme.textMuted}
                            value={deadline}
                            onChangeText={setDeadline}
                        />
                    </View>
                </View>

                {/* Emoji Selector */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>アイコン</Text>
                    <View style={styles.emojiGrid}>
                        {EMOJIS.map((emoji) => (
                            <TouchableOpacity
                                key={emoji}
                                style={[
                                    styles.emojiButton,
                                    selectedEmoji === emoji && { backgroundColor: theme.backgroundSecondary, borderColor: selectedColor, borderWidth: 2 }
                                ]}
                                onPress={() => setSelectedEmoji(emoji)}
                            >
                                <Text style={styles.emojiText}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Color Selector */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>テーマカラー</Text>
                    <View style={styles.colorRow}>
                        {COLORS.map((color) => (
                            <TouchableOpacity
                                key={color}
                                style={[
                                    styles.colorButton,
                                    { backgroundColor: color },
                                    selectedColor === color && { borderWidth: 3, borderColor: theme.text }
                                ]}
                                onPress={() => setSelectedColor(color)}
                            />
                        ))}
                    </View>
                </View>

                {/* Description */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>メモ</Text>
                    <TextInput
                        style={[styles.textArea, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                        placeholder="詳細な目的など（任意）"
                        placeholderTextColor={theme.textMuted}
                        multiline
                        numberOfLines={4}
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                <View style={{ height: 40 }} />
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
            fontWeight: '700',
            color: theme.text,
        },
        createButton: {
            padding: 8,
        },
        createButtonText: {
            fontSize: 16,
            fontWeight: '700',
        },
        scrollContent: {
            padding: 20,
        },
        mainInputSection: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 32,
        },
        emojiPicker: {
            width: 64,
            height: 64,
            borderRadius: 18,
            borderWidth: 1,
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
        },
        selectedEmoji: {
            fontSize: 32,
        },
        editBadge: {
            position: 'absolute',
            bottom: -4,
            right: -4,
            width: 20,
            height: 20,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: '#fff',
        },
        titleInput: {
            flex: 1,
            marginLeft: 16,
            fontSize: 22,
            fontWeight: '700',
        },
        formGroup: {
            marginBottom: 24,
        },
        label: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.textSecondary,
            marginBottom: 10,
        },
        inputWrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            height: 52,
            borderRadius: 12,
            paddingHorizontal: 16,
        },
        inputIcon: {
            marginRight: 10,
        },
        input: {
            flex: 1,
            fontSize: 16,
            fontWeight: '500',
        },
        inputUnit: {
            fontSize: 14,
            color: theme.textMuted,
            marginLeft: 8,
        },
        emojiGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
        },
        emojiButton: {
            width: 50,
            height: 50,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: 2,
        },
        emojiText: {
            fontSize: 24,
        },
        colorRow: {
            flexDirection: 'row',
            gap: 12,
        },
        colorButton: {
            width: 36,
            height: 36,
            borderRadius: 18,
        },
        textArea: {
            borderRadius: 12,
            padding: 16,
            fontSize: 15,
            height: 100,
            textAlignVertical: 'top',
        },
    });
