import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React from 'react';
import {
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '1';

export default function AboutScreen() {
    const handleOpenLink = (url: string) => {
        Linking.openURL(url);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome name="arrow-left" size={20} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>ℹ️ アプリについて</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* App Logo & Info */}
                <View style={styles.appInfo}>
                    <View style={styles.appIcon}>
                        <Text style={styles.appIconEmoji}>💑</Text>
                    </View>
                    <Text style={styles.appName}>Futari</Text>
                    <Text style={styles.appTagline}>ふたりの同棲をもっと楽しく</Text>
                    <Text style={styles.versionText}>
                        バージョン {APP_VERSION} ({BUILD_NUMBER})
                    </Text>
                </View>

                {/* Features */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>主な機能</Text>
                    <View style={styles.featureList}>
                        <View style={styles.featureItem}>
                            <View style={[styles.featureIcon, { backgroundColor: '#4ECDC415' }]}>
                                <Text style={styles.featureEmoji}>💰</Text>
                            </View>
                            <Text style={styles.featureText}>家計管理</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <View style={[styles.featureIcon, { backgroundColor: '#9B59B615' }]}>
                                <Text style={styles.featureEmoji}>🧹</Text>
                            </View>
                            <Text style={styles.featureText}>家事分担</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <View style={[styles.featureIcon, { backgroundColor: '#FFB34715' }]}>
                                <Text style={styles.featureEmoji}>🛒</Text>
                            </View>
                            <Text style={styles.featureText}>買い物リスト</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <View style={[styles.featureIcon, { backgroundColor: '#FF6B9D15' }]}>
                                <Text style={styles.featureEmoji}>📅</Text>
                            </View>
                            <Text style={styles.featureText}>カレンダー</Text>
                        </View>
                    </View>
                </View>

                {/* Legal Links */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>法的情報</Text>
                    <View style={styles.linkList}>
                        <TouchableOpacity
                            style={styles.linkItem}
                            onPress={() => handleOpenLink('https://futari.app/terms')}
                        >
                            <FontAwesome name="file-text-o" size={18} color="#666" />
                            <Text style={styles.linkText}>利用規約</Text>
                            <FontAwesome name="external-link" size={14} color="#ccc" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.linkItem}
                            onPress={() => handleOpenLink('https://futari.app/privacy')}
                        >
                            <FontAwesome name="shield" size={18} color="#666" />
                            <Text style={styles.linkText}>プライバシーポリシー</Text>
                            <FontAwesome name="external-link" size={14} color="#ccc" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.linkItem}
                            onPress={() => handleOpenLink('https://futari.app/license')}
                        >
                            <FontAwesome name="code" size={18} color="#666" />
                            <Text style={styles.linkText}>オープンソースライセンス</Text>
                            <FontAwesome name="external-link" size={14} color="#ccc" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Social Links */}
                <View style={styles.socialSection}>
                    <Text style={styles.socialTitle}>フォローする</Text>
                    <View style={styles.socialLinks}>
                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={() => handleOpenLink('https://twitter.com/FutariApp')}
                        >
                            <FontAwesome name="twitter" size={24} color="#1DA1F2" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={() => handleOpenLink('https://instagram.com/FutariApp')}
                        >
                            <FontAwesome name="instagram" size={24} color="#E4405F" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Credits */}
                <View style={styles.credits}>
                    <Text style={styles.creditsText}>Made with 💕 for couples</Text>
                    <Text style={styles.copyrightText}>© 2026 Futari. All rights reserved.</Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF9F0',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    appInfo: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    appIcon: {
        width: 100,
        height: 100,
        borderRadius: 24,
        backgroundColor: '#FF6B9D',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF6B9D',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    appIconEmoji: {
        fontSize: 48,
    },
    appName: {
        fontSize: 28,
        fontWeight: '700',
        color: '#333',
        marginTop: 16,
    },
    appTagline: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    versionText: {
        fontSize: 13,
        color: '#999',
        marginTop: 8,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#999',
        marginLeft: 24,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    featureList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 12,
    },
    featureItem: {
        width: '47%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureEmoji: {
        fontSize: 20,
    },
    featureText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    linkList: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    linkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
        gap: 12,
    },
    linkText: {
        flex: 1,
        fontSize: 15,
        color: '#333',
    },
    socialSection: {
        alignItems: 'center',
        marginTop: 32,
    },
    socialTitle: {
        fontSize: 13,
        color: '#999',
        marginBottom: 12,
    },
    socialLinks: {
        flexDirection: 'row',
        gap: 16,
    },
    socialButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    credits: {
        alignItems: 'center',
        marginTop: 32,
        paddingHorizontal: 24,
    },
    creditsText: {
        fontSize: 14,
        color: '#666',
    },
    copyrightText: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
});
