import { ThemeColors } from '@/constants/themes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/stores/authStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
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
import { supabase } from '@/lib/supabase';

export default function ProfileEditScreen() {
    const { theme, isDark } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { profile, refreshProfile } = useAuthStore();

    const [name, setName] = useState(profile?.display_name ?? '');
    const [emoji, setEmoji] = useState('👤');
    const [status, setStatus] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setName(profile.display_name ?? '');
            setStatus(profile.status_message ?? '');
        }
    }, [profile?.id]);

    const emojis = ['👤', '😊', '🐱', '🐶', '🦊', '🐻', '🐼', '🐨', '🤖', '👻', '✨', '🌈'];

    const handleSave = async () => {
        if (!profile?.id) return;
        setSaving(true);
        try {
            await supabase
                .from('users')
                .update({
                    display_name: name.trim() || null,
                    status_message: status.trim() || null,
                })
                .eq('id', profile.id);
            await refreshProfile();
            router.back();
        } catch (e: any) {
            Alert.alert('エラー', e?.message ?? '保存に失敗しました');
        }
        setSaving(false);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome name="arrow-left" size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>プロフィール編集</Text>
                <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={saving}>
                    <Text style={[styles.saveButtonText, { color: theme.primary }]}>{saving ? '保存中...' : '保存'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.avatarSection}>
                    <View style={[styles.avatarContainer, { backgroundColor: theme.primary + '15' }]}>
                        <Text style={styles.avatarEmoji}>{emoji}</Text>
                    </View>
                    <Text style={styles.avatarLabel}>アイコンを選択</Text>
                    <View style={styles.emojiGrid}>
                        {emojis.map((e) => (
                            <TouchableOpacity
                                key={e}
                                style={[
                                    styles.emojiItem,
                                    emoji === e && { backgroundColor: theme.primary + '20', borderColor: theme.primary }
                                ]}
                                onPress={() => setEmoji(e)}
                            >
                                <Text style={styles.emojiText}>{e}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>名前</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="名前を入力"
                            placeholderTextColor={theme.textMuted}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>ステータス</Text>
                        <TextInput
                            style={styles.input}
                            value={status}
                            onChangeText={setStatus}
                            placeholder="今の気持ちや状態を入力"
                            placeholderTextColor={theme.textMuted}
                        />
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <FontAwesome name="info-circle" size={16} color={theme.textSecondary} />
                    <Text style={styles.infoText}>
                        プロフィール情報はパートナーにも共有されます。
                    </Text>
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
        },
        avatarSection: {
            alignItems: 'center',
            padding: 24,
            backgroundColor: theme.card,
            marginBottom: 16,
        },
        avatarContainer: {
            width: 100,
            height: 100,
            borderRadius: 50,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
        },
        avatarEmoji: {
            fontSize: 50,
        },
        avatarLabel: {
            fontSize: 14,
            color: theme.textSecondary,
            marginBottom: 16,
        },
        emojiGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 12,
        },
        emojiItem: {
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.background,
            borderWidth: 2,
            borderColor: 'transparent',
        },
        emojiText: {
            fontSize: 24,
        },
        form: {
            padding: 16,
            backgroundColor: theme.card,
        },
        inputGroup: {
            marginBottom: 20,
        },
        label: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.textSecondary,
            marginBottom: 8,
        },
        input: {
            backgroundColor: theme.background,
            borderRadius: 12,
            padding: 14,
            fontSize: 16,
            color: theme.text,
            borderWidth: isDark ? 1 : 0,
            borderColor: theme.border,
        },
        infoBox: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            margin: 16,
            backgroundColor: theme.primary + '10',
            borderRadius: 12,
            gap: 12,
        },
        infoText: {
            flex: 1,
            fontSize: 13,
            color: theme.textSecondary,
            lineHeight: 18,
        },
    });
