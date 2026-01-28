import { useTheme } from '@/contexts/ThemeContext';
import { ThemeColors, useThemedStyles } from '@/hooks/useThemedStyles';
import { useCouple } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function InviteScreen() {
    const { theme, isDark } = useTheme();
    const styles = useThemedStyles(createStyles);
    const [mode, setMode] = useState<'share' | 'join'>('share');
    const [inputCode, setInputCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const { profile, partner, refreshProfile } = useAuthStore();
    const coupleId = profile?.couple_id ?? null;
    const { data: couple } = useCouple(coupleId);
    const inviteCode = couple?.invite_code ?? '------';
    const hasPartner = !!partner;

    const handleCopyCode = async () => {
        await Clipboard.setStringAsync(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Futariで一緒に生活を管理しよう！\n\n招待コード: ${inviteCode}\n\nアプリをダウンロード: https://futari.app`,
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    const handleJoinCouple = async () => {
        if (inputCode.length !== 6) {
            Alert.alert('エラー', '招待コードは6文字です');
            return;
        }
        if (!profile?.id) {
            router.push('/(auth)/join' as any);
            return;
        }
        setIsLoading(true);
        try {
            const { data: coupleRow, error: coupleError } = await supabase
                .from('couples')
                .select('id')
                .eq('invite_code', inputCode.toUpperCase())
                .single();
            if (coupleError || !coupleRow) {
                Alert.alert('エラー', '招待コードが見つかりません');
                setIsLoading(false);
                return;
            }
            const { count } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('couple_id', coupleRow.id);
            if ((count ?? 0) >= 2) {
                Alert.alert('エラー', 'このカップルはすでに2人登録されています');
                setIsLoading(false);
                return;
            }
            await supabase.from('users').update({ couple_id: coupleRow.id }).eq('id', profile.id);
            await refreshProfile();
            router.replace('/couple-matched' as any);
        } catch (e: any) {
            Alert.alert('エラー', e?.message ?? '参加に失敗しました');
        }
        setIsLoading(false);
    };

    if (hasPartner && mode === 'share') {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <FontAwesome name="arrow-left" size={20} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>💑 パートナーを招待</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={[styles.content, { padding: 24, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 16, color: theme.textSecondary, textAlign: 'center' }}>すでにパートナーと連携しています</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome name="arrow-left" size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>💑 パートナーを招待</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Mode Toggle */}
            <View style={styles.modeToggle}>
                <TouchableOpacity
                    style={[styles.modeButton, mode === 'share' && styles.modeButtonActive]}
                    onPress={() => setMode('share')}
                >
                    <Text style={[styles.modeButtonText, mode === 'share' && styles.modeButtonTextActive]}>
                        招待する
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modeButton, mode === 'join' && styles.modeButtonActive]}
                    onPress={() => setMode('join')}
                >
                    <Text style={[styles.modeButtonText, mode === 'join' && styles.modeButtonTextActive]}>
                        招待コードを入力
                    </Text>
                </TouchableOpacity>
            </View>

            {mode === 'share' ? (
                /* Share Mode */
                <View style={styles.content}>
                    <View style={styles.codeCard}>
                        <Text style={styles.codeLabel}>あなたの招待コード</Text>
                        <View style={styles.codeRow}>
                            <Text style={styles.codeText}>{inviteCode}</Text>
                            <TouchableOpacity onPress={handleCopyCode} style={styles.copyButton}>
                                <FontAwesome
                                    name={copied ? 'check' : 'copy'}
                                    size={18}
                                    color={copied ? theme.success : theme.primary}
                                />
                            </TouchableOpacity>
                        </View>
                        {copied && (
                            <Text style={styles.copiedText}>コピーしました！</Text>
                        )}
                    </View>

                    <View style={styles.instructions}>
                        <Text style={styles.instructionsTitle}>招待の手順</Text>
                        <View style={styles.step}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>1</Text>
                            </View>
                            <Text style={styles.stepText}>
                                パートナーにFutariアプリをダウンロードしてもらう
                            </Text>
                        </View>
                        <View style={styles.step}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>2</Text>
                            </View>
                            <Text style={styles.stepText}>
                                「招待コードを入力」から上記のコードを入力
                            </Text>
                        </View>
                        <View style={styles.step}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>3</Text>
                            </View>
                            <Text style={styles.stepText}>
                                マッチング完了！二人の生活管理を始めましょう
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                        <FontAwesome name="share-alt" size={18} color="#fff" />
                        <Text style={styles.shareButtonText}>招待を共有する</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                /* Join Mode */
                <View style={styles.content}>
                    <View style={styles.joinCard}>
                        <Text style={styles.joinLabel}>招待コードを入力</Text>
                        <TextInput
                            style={styles.codeInput}
                            placeholder="XXXXXX"
                            placeholderTextColor={theme.textMuted}
                            value={inputCode}
                            onChangeText={(text) => setInputCode(text.toUpperCase())}
                            maxLength={6}
                            autoCapitalize="characters"
                            autoCorrect={false}
                        />
                        <Text style={styles.joinHint}>
                            パートナーから受け取った6文字のコードを入力してください
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.joinButton,
                            inputCode.length !== 6 && styles.joinButtonDisabled,
                        ]}
                        onPress={handleJoinCouple}
                        disabled={inputCode.length !== 6 || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <FontAwesome name="heart" size={18} color="#fff" />
                                <Text style={styles.joinButtonText}>パートナーと繋がる</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Skip Option */}
            <TouchableOpacity
                style={styles.skipButton}
                onPress={() => router.replace('/')}
            >
                <Text style={styles.skipText}>あとで招待する</Text>
            </TouchableOpacity>
        </View>
    );
}

const createStyles = (theme: ThemeColors, isDark: boolean) => StyleSheet.create({
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
        backgroundColor: theme.background,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
    },
    modeToggle: {
        flexDirection: 'row',
        marginHorizontal: 16,
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 4,
        borderWidth: isDark ? 1 : 0,
        borderColor: theme.border,
    },
    modeButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    modeButtonActive: {
        backgroundColor: theme.primary,
    },
    modeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.textSecondary,
    },
    modeButtonTextActive: {
        color: '#fff',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    codeCard: {
        backgroundColor: theme.card,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: isDark ? 1 : 0,
        borderColor: theme.border,
    },
    codeLabel: {
        fontSize: 14,
        color: theme.textSecondary,
        marginBottom: 12,
    },
    codeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    codeText: {
        fontSize: 36,
        fontWeight: '700',
        color: theme.primary,
        letterSpacing: 8,
    },
    copyButton: {
        padding: 12,
        backgroundColor: theme.primary + '15',
        borderRadius: 12,
    },
    copiedText: {
        marginTop: 8,
        fontSize: 13,
        color: theme.success,
    },
    instructions: {
        marginTop: 32,
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 16,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
        gap: 12,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    stepText: {
        flex: 1,
        fontSize: 14,
        color: theme.textSecondary,
        lineHeight: 22,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.primary,
        borderRadius: 12,
        paddingVertical: 16,
        gap: 8,
        marginTop: 24,
    },
    shareButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    joinCard: {
        backgroundColor: theme.card,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: isDark ? 1 : 0,
        borderColor: theme.border,
    },
    joinLabel: {
        fontSize: 14,
        color: theme.textSecondary,
        marginBottom: 16,
    },
    codeInput: {
        width: '100%',
        backgroundColor: theme.backgroundSecondary,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 20,
        fontSize: 24,
        fontWeight: '700',
        color: theme.text,
        textAlign: 'center',
        letterSpacing: 6,
    },
    joinHint: {
        marginTop: 12,
        fontSize: 13,
        color: theme.textMuted,
        textAlign: 'center',
    },
    joinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.primary,
        borderRadius: 12,
        paddingVertical: 16,
        gap: 8,
        marginTop: 24,
    },
    joinButtonDisabled: {
        opacity: 0.5,
    },
    joinButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    skipButton: {
        alignItems: 'center',
        paddingVertical: 16,
        marginBottom: Platform.OS === 'ios' ? 32 : 16,
    },
    skipText: {
        fontSize: 14,
        color: theme.textMuted,
    },
});
