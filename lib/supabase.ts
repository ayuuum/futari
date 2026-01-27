import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
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
                setItem: async () => {},
                removeItem: async () => {},
            };
        }
        return AsyncStorage;
    }
    return ExpoSecureStoreAdapter;
};

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// #region agent log
if (typeof window !== 'undefined') {
  fetch('http://127.0.0.1:7246/ingest/b07a51bf-3965-436c-a011-6643b54686d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/supabase.ts:36',message:'Supabase client init',data:{hasUrl:!!url,urlLength:url.length,hasKey:!!key,keyLength:key.length,platform:typeof window!=='undefined'?'web':'ssr'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
}
// #endregion

// ビルド時の環境変数チェック: 空の場合はダミーURLを使用（SSR時のみ）
// 実際のランタイムでは環境変数が設定されている必要がある
const supabaseUrl = url || (typeof window === 'undefined' ? 'https://placeholder.supabase.co' : '');
const supabaseKey = key || (typeof window === 'undefined' ? 'placeholder-key' : '');

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        storage: getStorageAdapter(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
