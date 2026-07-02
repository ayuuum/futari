
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

export default function AuthCallback() {
    useEffect(() => {
        const handleCallback = async () => {
            if (Platform.OS === 'web') {
                // Parse the hash manually from window.location
                const hash = window.location.href.split('#')[1];
                if (hash) {
                    const params = new URLSearchParams(hash);
                    const access_token = params.get('access_token');
                    const refresh_token = params.get('refresh_token');

                    if (access_token && refresh_token) {
                        const { error } = await supabase.auth.setSession({
                            access_token,
                            refresh_token,
                        });

                        if (!error) {
                            router.replace('/(tabs)');
                            return;
                        }
                    }
                }
            }

            // Fallback: Check if session is already active (handled by Supabase auto-detect)
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.replace('/(tabs)');
            } else {
                // If no session found after a delay, maybe go back to login?
                // For now, let's just stay here or show an error
                console.log('No session found in callback');
            }
        };

        handleCallback();
    }, []);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#FF6B9D" />
            <Text style={styles.text}>ログイン中...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF9F0',
    },
    text: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
});
