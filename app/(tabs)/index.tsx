import { ThemeColors } from '@/constants/themes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import {
  useAnniversaries,
  useCalendarEvents,
  useChoreCompletionsThisWeek,
  useChores,
  useExpenses,
  useRecentExpenses,
  useSavingsGoals,
  useShoppingItems,
} from '@/lib/queries';
import { useAuthStore } from '@/stores/authStore';
import { Link } from 'expo-router';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

function formatRelativeDate(dateStr: string) {
  const d = new Date(dateStr);
  const t = new Date();
  const today = t.toISOString().slice(0, 10);
  const yesterday = new Date(t.getTime() - 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return '今日';
  if (dateStr === yesterday) return '昨日';
  const diff = Math.floor((t.getTime() - d.getTime()) / 86400000);
  if (diff >= 2 && diff <= 7) return `${diff}日前`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function nextAnniversaryFrom(anniversaries: { date: string; title: string; emoji: string | null; is_yearly: boolean }[]) {
  if (!anniversaries.length) return null;
  const today = new Date();
  const withNext = anniversaries.map((a) => {
    const [y, m, d] = a.date.split('-').map(Number);
    let next = new Date(today.getFullYear(), m - 1, d);
    if (next < today && a.is_yearly) next = new Date(today.getFullYear() + 1, m - 1, d);
    const daysUntil = Math.ceil((next.getTime() - today.getTime()) / 86400000);
    const years = today.getFullYear() - y;
    return { ...a, daysUntil, years, next };
  });
  withNext.sort((a, b) => a.daysUntil - b.daysUntil);
  const first = withNext[0];
  return first ? { title: first.title, emoji: first.emoji ?? '💕', daysUntil: first.daysUntil, years: first.years } : null;
}

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { profile, partner } = useAuthStore();
  const coupleId = profile?.couple_id ?? null;
  const myId = profile?.id ?? '';

  const { data: expenses = [] } = useExpenses(coupleId);
  const { data: recentExpenses = [] } = useRecentExpenses(coupleId, 5);
  const { data: chores = [] } = useChores(coupleId);
  const { data: completions = [] } = useChoreCompletionsThisWeek(coupleId);
  const { data: shoppingItems = [] } = useShoppingItems(coupleId);
  const { data: anniversaries = [] } = useAnniversaries(coupleId);
  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: todayEvents = [] } = useCalendarEvents(coupleId, todayStr, todayStr);
  const { data: savingsGoals = [] } = useSavingsGoals(coupleId);

  const partnerName = partner?.display_name ?? 'パートナー';

  const thisMonth = useMemo(() => {
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const myShare = expenses.filter((e) => e.paid_by === myId).reduce((s, e) => s + e.amount, 0);
    const partnerShare = expenses.filter((e) => e.paid_by !== myId).reduce((s, e) => s + e.amount, 0);
    return { totalExpenses: total, myShare, partnerShare };
  }, [expenses, myId]);

  const choresStats = useMemo(() => {
    const myCompleted = completions.filter((c) => c.completed_by === myId).length;
    const partnerCompleted = completions.filter((c) => c.completed_by !== myId).length;
    return { myCompleted, partnerCompleted, pending: chores.length };
  }, [completions, myId, chores.length]);

  const nextAnn = useMemo(() => nextAnniversaryFrom(anniversaries), [anniversaries]);
  const pendingShopping = shoppingItems.filter((i) => !i.is_purchased).length;
  const totalSavings = savingsGoals.reduce((s, g) => s + g.current_amount, 0);
  const mainGoal = savingsGoals[0];
  const mainGoalPct = mainGoal
    ? Math.min(100, Math.round((mainGoal.current_amount / mainGoal.target_amount) * 100))
    : 0;

  const isLoading = !coupleId && profile !== null;
  const formatCurrency = (amount: number) => amount.toLocaleString('ja-JP');

  if (profile && !coupleId) {
    return (
      <View style={[styles.container, { padding: 24, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.welcomeText}>パートナーを招待して連携しよう</Text>
        <Link href="/invite" asChild>
          <TouchableOpacity style={{ marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: theme.primary, borderRadius: 12 }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>招待する</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} testID="loading" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeEmoji}>💑</Text>
        <Text style={styles.welcomeText}>おかえりなさい！</Text>
        <Text style={styles.partnerText}>
          {partnerName}さんと一緒に頑張っています
        </Text>
      </View>

      {nextAnn && nextAnn.daysUntil <= 30 && (
        <Link href="/anniversaries" asChild>
          <TouchableOpacity style={styles.anniversaryBanner}>
            <Text style={styles.anniversaryEmoji}>{nextAnn.emoji}</Text>
            <View style={styles.anniversaryInfo}>
              <Text style={styles.anniversaryTitle}>{nextAnn.title}</Text>
              <Text style={styles.anniversarySubtext}>
                あと{nextAnn.daysUntil}日 • {nextAnn.years + 1}周年
              </Text>
            </View>
            <View style={styles.anniversaryDays}>
              <Text style={styles.anniversaryDaysNumber}>{nextAnn.daysUntil}</Text>
              <Text style={styles.anniversaryDaysLabel}>日後</Text>
            </View>
          </TouchableOpacity>
        </Link>
      )}

      {todayEvents.length > 0 && (
        <Link href="/calendar" asChild>
          <TouchableOpacity style={styles.todayCard}>
            <View style={styles.todayHeader}>
              <Text style={styles.todayIcon}>📅</Text>
              <Text style={styles.todayTitle}>今日の予定</Text>
            </View>
            {todayEvents.map((event) => (
              <View key={event.id} style={styles.todayEvent}>
                <Text style={styles.todayEventTitle}>{event.title}</Text>
                <Text style={styles.todayEventTime}>--</Text>
              </View>
            ))}
          </TouchableOpacity>
        </Link>
      )}

      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>📊 今月の家計</Text>
        <Text style={styles.totalAmount}>¥{formatCurrency(thisMonth.totalExpenses)}</Text>
        <View style={styles.shareRow}>
          <View style={styles.shareItem}>
            <Text style={styles.shareLabel}>あなた</Text>
            <Text style={styles.shareAmount}>¥{formatCurrency(thisMonth.myShare)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.shareItem}>
            <Text style={styles.shareLabel}>{partnerName}</Text>
            <Text style={styles.shareAmount}>¥{formatCurrency(thisMonth.partnerShare)}</Text>
          </View>
        </View>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceText}>
            差額: <Text style={styles.balanceAmount}>¥{formatCurrency(Math.abs(thisMonth.myShare - thisMonth.partnerShare))}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.quickActionsGrid}>
        {[
          { href: '/expenses/add', emoji: '💰', label: '支出追加' },
          { href: '/savings', emoji: '🏦', label: '共同貯金' },
          { href: '/calendar', emoji: '📅', label: '予定' },
          { href: '/report', emoji: '📊', label: '分析' },
        ].map((action, idx) => (
          <Link key={idx} href={action.href as any} asChild>
            <TouchableOpacity style={styles.actionButtonSmall} testID={action.label === '支出追加' ? 'add-expense-button' : undefined}>
              <Text style={styles.actionEmoji}>{action.emoji}</Text>
              <Text style={styles.actionTextSmall}>{action.label}</Text>
            </TouchableOpacity>
          </Link>
        ))}
      </View>

      <Link href="/savings" asChild>
        <TouchableOpacity style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💰 共同貯金</Text>
            <Text style={styles.seeAllText}>一覧を見る →</Text>
          </View>
          {mainGoal ? (
            <View style={styles.savingsSummary}>
              <View style={styles.savingsHeader}>
                <Text style={styles.savingsGoalTitle}>{mainGoal.title}</Text>
                <Text style={styles.savingsGoalPercentage}>{mainGoalPct}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${mainGoalPct}%`, backgroundColor: theme.primary },
                  ]}
                />
              </View>
              <View style={styles.savingsFooter}>
                <Text style={styles.savingsCurrentAmount}>
                  ¥{formatCurrency(mainGoal.current_amount)}
                  <Text style={styles.savingsTargetAmount}> / ¥{formatCurrency(mainGoal.target_amount)}</Text>
                </Text>
                <Text style={styles.savingsTotalLabel}>合計: ¥{formatCurrency(totalSavings)}</Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.seeAllText, { paddingVertical: 12 }]}>目標を追加しよう</Text>
          )}
        </TouchableOpacity>
      </Link>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🧹 今週の家事</Text>
          <Link href="/(tabs)/chores" asChild>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>すべて見る →</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <View style={styles.choresSummary}>
          <View style={styles.choresProgress}>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>{choresStats.myCompleted}</Text>
              <Text style={styles.progressLabel}>あなた</Text>
            </View>
            <Text style={styles.vsText}>vs</Text>
            <View style={styles.progressItem}>
              <Text style={[styles.progressNumber, { color: theme.secondary }]}>{choresStats.partnerCompleted}</Text>
              <Text style={styles.progressLabel}>{partnerName}</Text>
            </View>
          </View>
          {choresStats.pending > 0 && (
            <Text style={styles.pendingText}>残り{choresStats.pending}件のタスク</Text>
          )}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>💸 最近の支出</Text>
          <Link href="/(tabs)/expenses" asChild>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>すべて見る →</Text>
            </TouchableOpacity>
          </Link>
        </View>
        {recentExpenses.length === 0 ? (
          <Text style={[styles.expenseDescription, { paddingVertical: 12, color: theme.textSecondary }]}>今月はまだ支出がありません</Text>
        ) : (
          recentExpenses.map((expense) => (
            <View key={expense.id} style={styles.expenseItem}>
              <View style={styles.expenseLeft}>
                <Text style={styles.expenseDescription}>{expense.description ?? ''}</Text>
                <Text style={styles.expenseCategory}>{expense.category} • {formatRelativeDate(expense.date)}</Text>
              </View>
              <Text style={styles.expenseAmount}>¥{formatCurrency(expense.amount)}</Text>
            </View>
          ))
        )}
      </View>

      {pendingShopping > 0 && (
        <Link href="/(tabs)/shopping" asChild>
          <TouchableOpacity style={styles.shoppingBanner}>
            <Text style={styles.shoppingEmoji}>🛒</Text>
            <Text style={styles.shoppingText}>
              買い物リストに{pendingShopping}件のアイテムがあります
            </Text>
          </TouchableOpacity>
        </Link>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const createStyles = (theme: ThemeColors, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  welcomeEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
  },
  partnerText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: theme.card,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: isDark ? 1 : 0,
    borderColor: theme.border,
  },
  cardTitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 16,
  },
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  shareItem: {
    alignItems: 'center',
    flex: 1,
  },
  shareLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  shareAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: theme.border,
  },
  balanceRow: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  balanceText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  balanceAmount: {
    color: theme.primary,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  actionButtonSmall: {
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    width: '22%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: isDark ? 1 : 0,
    borderColor: theme.border,
  },
  actionEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionTextSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.text,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: theme.card,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: isDark ? 1 : 0,
    borderColor: theme.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  seeAllText: {
    fontSize: 14,
    color: theme.primary,
  },
  choresSummary: {
    alignItems: 'center',
  },
  choresProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.primary,
  },
  progressLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  vsText: {
    fontSize: 16,
    color: theme.border,
    fontWeight: '600',
  },
  pendingText: {
    fontSize: 13,
    color: theme.primary,
    marginTop: 12,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  expenseLeft: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.text,
  },
  expenseCategory: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  shoppingBanner: {
    backgroundColor: theme.secondary,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shoppingEmoji: {
    fontSize: 24,
  },
  shoppingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    flex: 1,
  },
  savingsSummary: {
    paddingTop: 8,
  },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  savingsGoalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  savingsGoalPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.primary,
  },
  savingsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 12,
  },
  savingsCurrentAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  savingsTargetAmount: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '400',
  },
  savingsTotalLabel: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  anniversaryBanner: {
    backgroundColor: theme.primary,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  anniversaryEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  anniversaryInfo: {
    flex: 1,
  },
  anniversaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  anniversarySubtext: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  anniversaryDays: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  anniversaryDaysNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.primary,
  },
  anniversaryDaysLabel: {
    fontSize: 11,
    color: theme.primary,
  },
  todayCard: {
    backgroundColor: theme.card,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: isDark ? 1 : 0,
    borderColor: theme.border,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  todayIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  todayTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },
  todayEvent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  todayEventTitle: {
    fontSize: 15,
    color: theme.text,
  },
  todayEventTime: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});
