import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface NotificationSettingItemProps {
    icon: React.ComponentProps<typeof FontAwesome>['name'];
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    iconColor?: string;
}

function NotificationSettingItem({
    icon,
    title,
    description,
    value,
    onValueChange,
    iconColor = '#666',
}: NotificationSettingItemProps) {
    return (
        <View style={styles.settingItem}>
            <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
                <FontAwesome name={icon} size={18} color={iconColor} />
            </View>
            <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{title}</Text>
                <Text style={styles.settingDescription}>{description}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#ddd', true: '#FF6B9D' }}
                thumbColor={value ? '#fff' : '#f4f3f4'}
            />
        </View>
    );
}

export default function NotificationSettingsScreen() {
    const [settings, setSettings] = useState({
        expense: true,
        chore: true,
        shopping: false,
        anniversary: true,
        calendar: true,
        partner: true,
        weekly: true,
    });

    const toggleSetting = (key: keyof typeof settings) => {
        setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome name="arrow-left" size={20} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>🔔 通知設定</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* General Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>活動通知</Text>
                    <View style={styles.sectionContent}>
                        <NotificationSettingItem
                            icon="money"
                            title="支出の追加"
                            description="パートナーが支出を追加したとき"
                            value={settings.expense}
                            onValueChange={() => toggleSetting('expense')}
                            iconColor="#4ECDC4"
                        />
                        <NotificationSettingItem
                            icon="check-square-o"
                            title="家事の完了"
                            description="パートナーが家事を完了したとき"
                            value={settings.chore}
                            onValueChange={() => toggleSetting('chore')}
                            iconColor="#9B59B6"
                        />
                        <NotificationSettingItem
                            icon="shopping-cart"
                            title="買い物リスト"
                            description="アイテムが追加・購入されたとき"
                            value={settings.shopping}
                            onValueChange={() => toggleSetting('shopping')}
                            iconColor="#FFB347"
                        />
                    </View>
                </View>

                {/* Reminder Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>リマインダー</Text>
                    <View style={styles.sectionContent}>
                        <NotificationSettingItem
                            icon="heart"
                            title="記念日"
                            description="記念日の1週間前・前日にお知らせ"
                            value={settings.anniversary}
                            onValueChange={() => toggleSetting('anniversary')}
                            iconColor="#FF6B9D"
                        />
                        <NotificationSettingItem
                            icon="calendar"
                            title="カレンダー"
                            description="予定の前日・当日にお知らせ"
                            value={settings.calendar}
                            onValueChange={() => toggleSetting('calendar')}
                            iconColor="#3498DB"
                        />
                    </View>
                </View>

                {/* Partner Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>パートナー</Text>
                    <View style={styles.sectionContent}>
                        <NotificationSettingItem
                            icon="user"
                            title="パートナーからのメッセージ"
                            description="感謝メッセージなどを受け取る"
                            value={settings.partner}
                            onValueChange={() => toggleSetting('partner')}
                            iconColor="#FF6B9D"
                        />
                    </View>
                </View>

                {/* Summary Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>サマリー</Text>
                    <View style={styles.sectionContent}>
                        <NotificationSettingItem
                            icon="bar-chart"
                            title="週次レポート"
                            description="毎週日曜日に週間サマリーを受け取る"
                            value={settings.weekly}
                            onValueChange={() => toggleSetting('weekly')}
                            iconColor="#2ECC71"
                        />
                    </View>
                </View>

                <View style={styles.note}>
                    <FontAwesome name="info-circle" size={14} color="#999" />
                    <Text style={styles.noteText}>
                        通知を受け取るには、端末の設定でFutariアプリの通知を許可してください
                    </Text>
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
    note: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginHorizontal: 24,
        marginTop: 24,
        gap: 8,
    },
    noteText: {
        flex: 1,
        fontSize: 13,
        color: '#999',
        lineHeight: 18,
    },
});
