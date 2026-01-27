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

export default function JoinScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        if (!name || !email || !password || !inviteCode) {
            Alert.alert('エラー', 'すべての項目を入力してください');
            return;
        }

        if (inviteCode.length !== 6) {
            Alert.alert('エラー', '招待コードは6文字です');
            return;
        }

        setLoading(true);

        // 1. Find couple by invite code
        const { data: couple, error: coupleError } = await supabase
            .from('couples')
            .select('*')
            .eq('invite_code', inviteCode.toUpperCase())
            .single();

        if (coupleError || !couple) {
            Alert.alert('エラー', '招待コードが見つかりません');
            setLoading(false);
            return;
        }

        // 2. Check if couple already has 2 members
        const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('couple_id', couple.id);

        if (count && count >= 2) {
            Alert.alert('エラー', 'このカップルはすでに2人登録されています');
            setLoading(false);
            return;
        }

        // 3. Sign up with Supabase Auth (trigger creates users row)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: { 
                data: { 
                    display_name: name,
                    language: 'ja' // メールテンプレートの言語設定
                } 
            },
        });

        if (authError) {
            Alert.alert('登録エラー', authError.message);
            setLoading(false);
            return;
        }

        if (authData.user) {
            // 4. Update user profile: link to couple and set display_name
            const { error: profileError } = await supabase
                .from('users')
                .update({ couple_id: couple.id, display_name: name })
                .eq('id', authData.user.id);

            if (profileError) {
                Alert.alert('エラー', 'プロフィールの更新に失敗しました');
                setLoading(false);
                return;
            }

            // Check if session exists (email confirmation may be required)
            if (authData.session) {
                // Session exists, navigate to tabs
                Alert.alert('参加完了！🎉', 'パートナーとつながりました！', [
                    { text: 'はじめる', onPress: () => router.replace('/(tabs)') },
                ]);
            } else {
                // Email confirmation required
                Alert.alert(
                    'メール確認が必要です',
                    `登録用のメールを ${email} に送信しました。\nメール内のリンクをクリックしてアカウントを確認してください。\n\n（メール確認後にログインしてください）`,
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
                <Text style={styles.logo}>💌</Text>
                <Text style={styles.title}>招待コードで参加</Text>
                <Text style={styles.subtitle}>パートナーからもらった招待コードを入力</Text>

                <View style={styles.form}>
                    <TextInput
                        style={styles.codeInput}
                        placeholder="招待コード（6文字）"
                        placeholderTextColor="#999"
                        value={inviteCode}
                        onChangeText={(text) => setInviteCode(text.toUpperCase())}
                        maxLength={6}
                        autoCapitalize="characters"
                    />

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
                        onPress={handleJoin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>参加する</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Link href="/(auth)/signup" asChild>
                        <TouchableOpacity>
                            <Text style={styles.linkText}>← 新規登録に戻る</Text>
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
        fontSize: 64,
        textAlign: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
    },
    form: {
        gap: 16,
    },
    codeInput: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: 8,
        textAlign: 'center',
        borderWidth: 2,
        borderColor: '#4ECDC4',
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
        backgroundColor: '#4ECDC4',
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
    footer: {
        alignItems: 'center',
        marginTop: 32,
    },
    linkText: {
        color: '#FF6B9D',
        fontSize: 14,
        fontWeight: '600',
    },
});
