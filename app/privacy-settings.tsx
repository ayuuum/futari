import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function PrivacySettingsScreen() {
    const [settings, setSettings] = useState({
        shareActivity: true,
        showLastSeen: true,
    });

    const handleDeleteAccount = () => {
        Alert.alert(
            'アカウント削除',
            '本当にアカウントを削除しますか？この操作は取り消せません。すべてのデータが削除されます。',
            [
                { text: 'キャンセル', style: 'cancel' },
                {
                    text: '削除する',
                    style: 'destructive',
                    onPress: () => {
                        // TODO: Implement account deletion
                        Alert.alert('確認', 'アカウント削除のリクエストを受け付けました。');
                    },
                },
            ]
        );
    };

    const handleExportData = () => {
        Alert.alert(
            'データエクスポート',
            'あなたのデータをエクスポートします。メールでダウンロードリンクをお送りします。',
            [
                { text: 'キャンセル', style: 'cancel' },
                {
                    text: 'エクスポート',
                    onPress: () => {
                        // TODO: Implement data export
                        Alert.alert('完了', 'エクスポートリンクをメールで送信しました。');
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome name="arrow-left" size={20} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>🔒 プライバシー</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Data Sharing */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>パートナーとの共有</Text>
                    <View style={styles.sectionContent}>
                        <View style={styles.settingItem}>
                            <View style={[styles.iconContainer, { backgroundColor: '#FF6B9D15' }]}>
                                <FontAwesome name="share-alt" size={18} color="#FF6B9D" />
                            </View>
                            <View style={styles.settingContent}>
                                <Text style={styles.settingTitle}>活動状況を共有</Text>
                                <Text style={styles.settingDescription}>
                                    支出・家事の完了をパートナーに共有
                                </Text>
                            </View>
                            <Switch
                                value={settings.shareActivity}
                                onValueChange={(value) =>
                                    setSettings({ ...settings, shareActivity: value })
                                }
                                trackColor={{ false: '#ddd', true: '#FF6B9D' }}
                                thumbColor="#fff"
                            />
                        </View>
                        <View style={styles.settingItem}>
                            <View style={[styles.iconContainer, { backgroundColor: '#3498DB15' }]}>
                                <FontAwesome name="clock-o" size={18} color="#3498DB" />
                            </View>
                            <View style={styles.settingContent}>
                                <Text style={styles.settingTitle}>最終ログインを表示</Text>
                                <Text style={styles.settingDescription}>
                                    パートナーに最終ログイン時間を表示
                                </Text>
                            </View>
                            <Switch
                                value={settings.showLastSeen}
                                onValueChange={(value) =>
                                    setSettings({ ...settings, showLastSeen: value })
                                }
                                trackColor={{ false: '#ddd', true: '#FF6B9D' }}
                                thumbColor="#fff"
                            />
                        </View>
                    </View>
                </View>

                {/* Data Management */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>データ管理</Text>
                    <View style={styles.sectionContent}>
                        <TouchableOpacity style={styles.actionItem} onPress={handleExportData}>
                            <View style={[styles.iconContainer, { backgroundColor: '#2ECC7115' }]}>
                                <FontAwesome name="download" size={18} color="#2ECC71" />
                            </View>
                            <View style={styles.settingContent}>
                                <Text style={styles.settingTitle}>データをエクスポート</Text>
                                <Text style={styles.settingDescription}>
                                    あなたのデータをダウンロード
                                </Text>
                            </View>
                            <FontAwesome name="chevron-right" size={14} color="#ccc" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Security Info */}
                <View style={styles.infoCard}>
                    <FontAwesome name="shield" size={24} color="#4ECDC4" />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>データは安全に保護されています</Text>
                        <Text style={styles.infoText}>
                            • 通信はSSL/TLSで暗号化{'\n'}
                            • パスワードはハッシュ化して保存{'\n'}
                            • 定期的なセキュリティ監査を実施
                        </Text>
                    </View>
                </View>

                {/* Danger Zone */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: '#E74C3C' }]}>危険ゾーン</Text>
                    <View style={styles.sectionContent}>
                        <TouchableOpacity style={styles.dangerItem} onPress={handleDeleteAccount}>
                            <View style={[styles.iconContainer, { backgroundColor: '#E74C3C15' }]}>
                                <FontAwesome name="trash" size={18} color="#E74C3C" />
                            </View>
                            <View style={styles.settingContent}>
                                <Text style={[styles.settingTitle, { color: '#E74C3C' }]}>
                                    アカウントを削除
                                </Text>
                                <Text style={styles.settingDescription}>
                                    すべてのデータが完全に削除されます
                                </Text>
                            </View>
                            <FontAwesome name="chevron-right" size={14} color="#E74C3C" />
                        </TouchableOpacity>
                    </View>
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
    section: {
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#999',
        marginLeft: 24,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionContent: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    dangerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingContent: {
        flex: 1,
        marginLeft: 12,
    },
    settingTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
    },
    settingDescription: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#E8F8F5',
        marginHorizontal: 16,
        marginTop: 24,
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 13,
        color: '#666',
        lineHeight: 20,
    },
});
