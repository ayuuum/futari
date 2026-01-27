import { ThemeColors } from '@/constants/themes';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/stores/authStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, router } from 'expo-router';
import React from 'react';
import {
  Alert, ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface SettingItemProps {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  description: string;
  href: string;
  iconColor?: string;
}

function SettingItem({ icon, title, description, href, iconColor }: SettingItemProps) {
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme, isDark);
  const color = iconColor || theme.textSecondary;

  return (
    <Link href={href as any} asChild>
      <TouchableOpacity style={styles.settingItem}>
        <View style={StyleSheet.flatten([styles.iconContainer, { backgroundColor: color + '15' }])}>
          <FontAwesome name={icon} size={20} color={color} />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color={theme.border} />
      </TouchableOpacity>
    </Link>
  );
}

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingSection({ title, children }: SettingSectionProps) {
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme, isDark);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme, isDark);
  const { profile, partner, signOut } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト', style: 'destructive', onPress: async () => {
          await signOut();
          router.replace('/(auth)/login' as any);
        }
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Preview */}
      <View style={styles.profileSection}>
        <View style={StyleSheet.flatten([styles.avatarContainer, { backgroundColor: theme.primary + '20' }])}>
          <Text style={styles.avatarEmoji}>👤</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile?.display_name ?? 'あなた'}</Text>
          <Text style={styles.profileStatus}>
            {partner ? '💑 パートナーと連携中' : '👤 パートナーを招待して連携しよう'}
          </Text>
        </View>
        <Link href="/profile-edit" asChild>
          <TouchableOpacity style={StyleSheet.flatten([styles.editButton, { backgroundColor: theme.primary + '10' }])}>
            <Text style={StyleSheet.flatten([styles.editButtonText, { color: theme.primary }])}>編集</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Main Features */}
      <SettingSection title="機能">
        <SettingItem
          icon="calendar"
          title="カレンダー"
          description="予定・イベントの共有管理"
          href="/calendar"
          iconColor={theme.primary}
        />
        <SettingItem
          icon="bar-chart"
          title="月次レポート"
          description="支出・家事の振り返り"
          href="/report"
          iconColor={theme.secondary}
        />
        <SettingItem
          icon="refresh"
          title="固定費管理"
          description="家賃・光熱費・サブスク"
          href="/recurring-expenses"
          iconColor="#FFB347"
        />
        <SettingItem
          icon="heart"
          title="記念日"
          description="大切な日のリマインダー"
          href="/anniversaries"
          iconColor={theme.primary}
        />
        <SettingItem
          icon="book"
          title="二人のルールブック"
          description="共有ルールの管理"
          href="/rulebook"
          iconColor="#9B59B6"
        />
      </SettingSection>

      {/* Couple Settings */}
      <SettingSection title="カップル設定">
        <SettingItem
          icon="user-plus"
          title="パートナーを招待"
          description="招待コードを共有・入力"
          href="/invite"
          iconColor={theme.primary}
        />
        <SettingItem
          icon="users"
          title="カップル情報"
          description="お二人の情報を編集"
          href="/couple-settings"
          iconColor="#9B59B6"
        />
        <SettingItem
          icon="sliders"
          title="負担割合"
          description="支出・家事の分担比率"
          href="/split-settings"
          iconColor="#3498DB"
        />
      </SettingSection>

      {/* App Settings */}
      <SettingSection title="アプリ設定">
        <SettingItem
          icon="paint-brush"
          title="テーマ設定"
          description="カラーテーマ・ダークモード"
          href="/theme-settings"
          iconColor={theme.primary}
        />
        <SettingItem
          icon="bell"
          title="通知設定"
          description="プッシュ通知のオン/オフ"
          href="/notification-settings"
          iconColor="#E74C3C"
        />
        <SettingItem
          icon="shield"
          title="プライバシー"
          description="データとセキュリティ"
          href="/privacy-settings"
          iconColor="#2ECC71"
        />
      </SettingSection>

      {/* Support */}
      <SettingSection title="サポート">
        <SettingItem
          icon="question-circle"
          title="ヘルプ"
          description="使い方・よくある質問"
          href="/help"
          iconColor={theme.textSecondary}
        />
        <SettingItem
          icon="info-circle"
          title="アプリについて"
          description="バージョン 1.0.0"
          href="/about"
          iconColor={theme.textSecondary}
        />
      </SettingSection>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>ログアウト</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const createStyles = (theme: ThemeColors, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: isDark ? 1 : 0,
    borderColor: theme.border,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  profileStatus: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
    marginLeft: 24,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: theme.card,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: isDark ? 1 : 0,
    borderColor: theme.border,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
  },
  settingDescription: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: theme.card,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: isDark ? 1 : 0,
    borderColor: theme.border,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#E74C3C',
  },
});
