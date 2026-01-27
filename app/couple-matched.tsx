import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Platform,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function CoupleMatchedScreen() {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const heartAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animation sequence
        Animated.sequence([
            // Scale up the heart
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            // Fade in the text
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();

        // Continuous heart pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(heartAnim, {
                    toValue: 1.1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(heartAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Navigate to home after 3 seconds
        const timer = setTimeout(() => {
            router.replace('/');
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const heartScale = Animated.multiply(scaleAnim, heartAnim);

    return (
        <View style={styles.container}>
            {/* Confetti Background */}
            <View style={styles.confettiContainer}>
                {[...Array(20)].map((_, i) => (
                    <Text
                        key={i}
                        style={[
                            styles.confetti,
                            {
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                transform: [{ rotate: `${Math.random() * 360}deg` }],
                            },
                        ]}
                    >
                        {['🎉', '💕', '✨', '💖', '🎊'][Math.floor(Math.random() * 5)]}
                    </Text>
                ))}
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                <Animated.View
                    style={[
                        styles.heartContainer,
                        {
                            transform: [{ scale: heartScale }],
                        },
                    ]}
                >
                    <View style={styles.heartCircle}>
                        <FontAwesome name="heart" size={60} color="#FF6B9D" />
                    </View>
                </Animated.View>

                <Animated.View style={{ opacity: fadeAnim }}>
                    <Text style={styles.title}>マッチング成功！</Text>
                    <Text style={styles.subtitle}>
                        Futariで二人の生活を{'\n'}一緒に管理しましょう
                    </Text>

                    {/* Partner Preview (Mock) */}
                    <View style={styles.partnerPreview}>
                        <View style={styles.partnerCard}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarEmoji}>👤</Text>
                            </View>
                            <Text style={styles.partnerName}>あなた</Text>
                        </View>
                        <View style={styles.heartBadge}>
                            <FontAwesome name="heart" size={16} color="#FF6B9D" />
                        </View>
                        <View style={styles.partnerCard}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarEmoji}>💑</Text>
                            </View>
                            <Text style={styles.partnerName}>パートナー</Text>
                        </View>
                    </View>
                </Animated.View>

                <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                    <Text style={styles.footerText}>ホーム画面に移動します...</Text>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF9F0',
    },
    confettiContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    confetti: {
        position: 'absolute',
        fontSize: 24,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    heartContainer: {
        marginBottom: 32,
    },
    heartCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFF0F5',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF6B9D',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#333',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
    partnerPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40,
        gap: 16,
    },
    partnerCard: {
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FFE4EC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatarEmoji: {
        fontSize: 28,
    },
    partnerName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    heartBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF0F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 60 : 40,
    },
    footerText: {
        fontSize: 14,
        color: '#999',
    },
});
