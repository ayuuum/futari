import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

const ExpoSecureStoreAdapter = {
    getItem: (key: string) => {
        return SecureStore.getItemAsync(key);
    },
    setItem: (key: string, value: string) => {
        SecureStore.setItemAsync(key, value);
    },
    removeItem: (key: string) => {
        SecureStore.deleteItemAsync(key);
    },
};

// SSR 対応: Web 環境で window が未定義の場合は一時的なストレージアダプターを使用
const getStorageAdapter = () => {
    if (Platform.OS === 'web') {
        // SSR 中（window が未定義）の場合は一時的なストレージ
        if (typeof window === 'undefined') {
            return {
                getItem: async () => null,
                setItem: async () => { },
                removeItem: async () => { },
            };
        }
        return AsyncStorage;
    }
    return ExpoSecureStoreAdapter;
};

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// ビルド時の環境変数チェック: 空の場合はダミーURLを使用（SSR時のみ）
// 実際のランタイムでは環境変数が設定されている必要がある
const supabaseUrl = url || (typeof window === 'undefined' ? 'https://placeholder.supabase.co' : '');
const supabaseKey = key || (typeof window === 'undefined' ? 'placeholder-key' : '');

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        storage: getStorageAdapter(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

export const signInWithGoogle = async () => {
    const redirectUrl = Linking.createURL('/(auth)/login');
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: Platform.OS !== 'web',
        },
    });

    if (error) throw error;

    if (Platform.OS !== 'web' && data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (result.type === 'success') {
            const { url } = result;
            const params = Linking.parse(url);
            const { access_token, refresh_token } = params.queryParams as any;

            if (access_token && refresh_token) {
                return await supabase.auth.setSession({
                    access_token,
                    refresh_token,
                });
            }
        }
    }
    return { data, error };
};
