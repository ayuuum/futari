import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    TouchableOpacity,
    TouchableOpacityProps,
    ViewStyle
} from 'react-native';

// ================================
// Animated Button Component
// ================================

interface AnimatedButtonProps extends TouchableOpacityProps {
    children: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
    bounceScale?: number;
}

export function AnimatedButton({
    children,
    style,
    onPress,
    bounceScale = 0.95,
    ...props
}: AnimatedButtonProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: bounceScale,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 10,
        }).start();
    };

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
                style={style}
                {...props}
            >
                {children}
            </TouchableOpacity>
        </Animated.View>
    );
}

// ================================
// Fade In View Component
// ================================

interface FadeInViewProps {
    children: React.ReactNode;
    duration?: number;
    delay?: number;
    style?: ViewStyle | ViewStyle[];
}

export function FadeInView({
    children,
    duration = 500,
    delay = 0,
    style,
}: FadeInViewProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration,
                delay,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
            Animated.timing(translateAnim, {
                toValue: 0,
                duration,
                delay,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                style,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: translateAnim }],
                },
            ]}
        >
            {children}
        </Animated.View>
    );
}

// ================================
// Slide In View Component
// ================================

interface SlideInViewProps {
    children: React.ReactNode;
    direction?: 'left' | 'right' | 'up' | 'down';
    duration?: number;
    delay?: number;
    style?: ViewStyle | ViewStyle[];
}

export function SlideInView({
    children,
    direction = 'up',
    duration = 400,
    delay = 0,
    style,
}: SlideInViewProps) {
    const isHorizontal = direction === 'left' || direction === 'right';
    const initialOffset = direction === 'left' || direction === 'down' ? -50 : 50;
    const translateAnim = useRef(new Animated.Value(initialOffset)).current;

    useEffect(() => {
        Animated.timing(translateAnim, {
            toValue: 0,
            duration,
            delay,
            useNativeDriver: true,
            easing: Easing.out(Easing.back(1.5)),
        }).start();
    }, []);

    return (
        <Animated.View
            style={[
                style,
                {
                    transform: isHorizontal
                        ? [{ translateX: translateAnim }]
                        : [{ translateY: translateAnim }],
                },
            ]}
        >
            {children}
        </Animated.View>
    );
}

// ================================
// Staggered List Component
// ================================

interface StaggeredListProps {
    children: React.ReactNode[];
    staggerDelay?: number;
    itemDuration?: number;
}

export function StaggeredList({
    children,
    staggerDelay = 100,
    itemDuration = 400,
}: StaggeredListProps) {
    return (
        <>
            {React.Children.map(children, (child, index) => (
                <FadeInView
                    key={index}
                    delay={index * staggerDelay}
                    duration={itemDuration}
                >
                    {child}
                </FadeInView>
            ))}
        </>
    );
}

// ================================
// Pulse Animation Component
// ================================

interface PulseViewProps {
    children: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
    pulseScale?: number;
    duration?: number;
}

export function PulseView({
    children,
    style,
    pulseScale = 1.05,
    duration = 1000,
}: PulseViewProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: pulseScale,
                    duration: duration / 2,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: duration / 2,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
            ])
        );
        pulse.start();

        return () => pulse.stop();
    }, []);

    return (
        <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
            {children}
        </Animated.View>
    );
}

// ================================
// Shake Animation Component
// ================================

interface ShakeViewProps {
    children: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
    trigger?: boolean;
}

export function ShakeView({ children, style, trigger }: ShakeViewProps) {
    const shakeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (trigger) {
            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
            ]).start();
        }
    }, [trigger]);

    return (
        <Animated.View style={[style, { transform: [{ translateX: shakeAnim }] }]}>
            {children}
        </Animated.View>
    );
}

// ================================
// Bounce Animation Component
// ================================

interface BounceViewProps {
    children: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
    delay?: number;
}

export function BounceView({ children, style, delay = 0 }: BounceViewProps) {
    const bounceAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.delay(delay),
            Animated.spring(bounceAnim, {
                toValue: 1,
                tension: 100,
                friction: 5,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const scale = bounceAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    return (
        <Animated.View style={[style, { transform: [{ scale }] }]}>
            {children}
        </Animated.View>
    );
}

// ================================
// Floating Animation Component
// ================================

interface FloatingViewProps {
    children: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
    amplitude?: number;
    duration?: number;
}

export function FloatingView({
    children,
    style,
    amplitude = 5,
    duration = 2000,
}: FloatingViewProps) {
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const float = Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: 1,
                    duration: duration / 2,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: duration / 2,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
            ])
        );
        float.start();

        return () => float.stop();
    }, []);

    const translateY = floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -amplitude],
    });

    return (
        <Animated.View style={[style, { transform: [{ translateY }] }]}>
            {children}
        </Animated.View>
    );
}
