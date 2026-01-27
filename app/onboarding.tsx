import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

const ONBOARDING_KEY = '@futari_onboarding_complete';

interface OnboardingSlide {
    id: string;
    emoji: string;
    title: string;
    description: string;
    color: string;
}

const slides: OnboardingSlide[] = [
    {
        id: '1',
        emoji: '💑',
        title: 'ふたりの同棲を\nもっと楽しく',
        description: 'Futariは同棲カップル専用の\n生活管理アプリです',
        color: '#FF6B9D',
    },
    {
        id: '2',
        emoji: '💰',
        title: '家計を一緒に管理',
        description: '支出を記録して負担割合を見える化\n「誰がいくら出した？」の\nモヤモヤを解消',
        color: '#4ECDC4',
    },
    {
        id: '3',
        emoji: '🧹',
        title: '家事分担もスムーズ',
        description: '誰がどの家事をやったか記録\n偏りを防いでフェアな分担を実現',
        color: '#9B59B6',
    },
    {
        id: '4',
        emoji: '📅',
        title: '大切な予定を共有',
        description: 'カレンダーで予定を共有\n記念日リマインダーで\n大切な日を忘れない',
        color: '#3498DB',
    },
    {
        id: '5',
        emoji: '✨',
        title: 'さあ、始めよう！',
        description: 'パートナーを招待して\nふたりの生活をもっと快適に',
        color: '#FF6B9D',
    },
];

export default function OnboardingScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            // Fade out
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start(() => {
                const nextIndex = currentIndex + 1;
                setCurrentIndex(nextIndex);
                scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: false });
                // Fade in
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            });
        } else {
            completeOnboarding();
        }
    };

    const handleSkip = () => {
        completeOnboarding();
    };

    const completeOnboarding = async () => {
        try {
            await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        } catch (error) {
            console.error('Error saving onboarding status:', error);
        }
        router.replace('/(auth)/login' as any);
    };

    const handleScroll = (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / width);
        if (index !== currentIndex && index >= 0 && index < slides.length) {
            setCurrentIndex(index);
        }
    };

    const currentSlide = slides[currentIndex];
    const isLastSlide = currentIndex === slides.length - 1;

    return (
        <View style={styles.container}>
            {/* Skip button */}
            {!isLastSlide && (
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipText}>スキップ</Text>
                </TouchableOpacity>
            )}

            {/* Slide Content */}
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                scrollEventThrottle={16}
                style={styles.scrollView}
            >
                {slides.map((slide, index) => (
                    <View key={slide.id} style={styles.slide}>
                        <View
                            style={[
                                styles.emojiContainer,
                                { backgroundColor: slide.color + '20' },
                            ]}
                        >
                            <Text style={styles.emoji}>{slide.emoji}</Text>
                        </View>
                        <Text style={styles.title}>{slide.title}</Text>
                        <Text style={styles.description}>{slide.description}</Text>
                    </View>
                ))}
            </ScrollView>

            {/* Bottom section */}
            <View style={styles.bottomSection}>
                {/* Dots */}
                <View style={styles.dotsContainer}>
                    {slides.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                {
                                    width: index === currentIndex ? 24 : 8,
                                    opacity: index === currentIndex ? 1 : 0.3,
                                    backgroundColor: currentSlide.color,
                                },
                            ]}
                        />
                    ))}
                </View>

                {/* Next Button */}
                <TouchableOpacity
                    style={[
                        styles.nextButton,
                        { backgroundColor: currentSlide.color },
                    ]}
                    onPress={handleNext}
                >
                    <Text style={styles.nextButtonText}>
                        {isLastSlide ? '始める' : '次へ'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF9F0',
    },
    skipButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    skipText: {
        fontSize: 16,
        color: '#999',
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    slide: {
        width,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emojiContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    emoji: {
        fontSize: 80,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 38,
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 26,
    },
    bottomSection: {
        paddingHorizontal: 40,
        paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        gap: 8,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    nextButton: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    nextButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
});
