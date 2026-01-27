import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function SignupScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const generateInviteCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const handleSignup = async () => {
        if (!name || !email || !password) {
            Alert.alert('エラー', 'すべての項目を入力してください');
            return;
        }

        if (password.length < 6) {
            Alert.alert('エラー', 'パスワードは6文字以上にしてください');
            return;
        }

        setLoading(true);

        // 1. Sign up with Supabase Auth (trigger creates users row with display_name from meta)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name: name } },
        });

        if (authError) {
            Alert.alert('登録エラー', authError.message);
            setLoading(false);
            return;
        }

        if (authData.user) {
            // 2. Create couple with invite code
            const inviteCode = generateInviteCode();
            const { data: couple, error: coupleError } = await supabase
                .from('couples')
                .insert({ invite_code: inviteCode })
                .select()
                .single();

            if (coupleError) {
                Alert.alert('エラー', 'カップル情報の作成に失敗しました');
                setLoading(false);
                return;
            }

            // 3. Update user profile (trigger already inserted row; set couple_id and display_name)
            const { error: profileError } = await supabase
                .from('users')
                .update({ couple_id: couple.id, display_name: name })
                .eq('id', authData.user.id);

            if (profileError) {
                Alert.alert('エラー', 'プロフィールの更新に失敗しました');
                setLoading(false);
                return;
            }

            // 4. Check if session exists (email confirmation may be required)
            if (authData.session) {
                // Session exists, navigate to tabs
                Alert.alert(
                    '登録完了！🎉',
                    `パートナーに招待コードを共有してください:\n\n${inviteCode}`,
                    [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
                );
            } else {
                // Email confirmation required
                Alert.alert(
                    'メール確認が必要です',
                    `登録用のメールを ${email} に送信しました。\nメール内のリンクをクリックしてアカウントを確認してください。\n\n招待コード: ${inviteCode}\n（メール確認後にログインしてください）`,
                    [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
                );
            }
        }

        setLoading(false);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.content}>
                <Text style={styles.logo}>💑 Futari</Text>
                <Text style={styles.subtitle}>新規登録</Text>

                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="お名前"
                        placeholderTextColor="#999"
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="メールアドレス"
                        placeholderTextColor="#999"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="パスワード（6文字以上）"
                        placeholderTextColor="#999"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSignup}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>登録する</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>または</Text>
                    <View style={styles.dividerLine} />
                </View>

                <Link href="/(auth)/join" asChild>
                    <TouchableOpacity style={styles.secondaryButton}>
                        <Text style={styles.secondaryButtonText}>招待コードで参加</Text>
                    </TouchableOpacity>
                </Link>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>すでにアカウントをお持ちの方は</Text>
                    <Link href="/(auth)/login" asChild>
                        <TouchableOpacity>
                            <Text style={styles.linkText}>ログイン</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF9F0',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    logo: {
        fontSize: 48,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 20,
        color: '#333',
        textAlign: 'center',
        marginBottom: 32,
        fontWeight: '600',
    },
    form: {
        gap: 16,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    button: {
        backgroundColor: '#FF6B9D',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    dividerText: {
        color: '#999',
        paddingHorizontal: 16,
    },
    secondaryButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4ECDC4',
    },
    secondaryButtonText: {
        color: '#4ECDC4',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        gap: 8,
    },
    footerText: {
        color: '#666',
        fontSize: 14,
    },
    linkText: {
        color: '#FF6B9D',
        fontSize: 14,
        fontWeight: '600',
    },
});
