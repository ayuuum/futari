import { useCalendarEvents } from '@/lib/queries';
import { useAuthStore } from '@/stores/authStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');
const DAYS = ['日', '月', '火', '水', '木', '金', '土'];
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const categoryColors: Record<string, string> = {
    date: '#4ECDC4',
    anniversary: '#FF6B9D',
    payment: '#FFB347',
    task: '#9B59B6',
    other: '#95A5A6',
};

interface CalendarDay {
    date: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    events: { id: string; title: string; date: string; category: string; color: string }[];
}

export default function CalendarScreen() {
    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState<number | null>(today.getDate());

    const { profile } = useAuthStore();
    const coupleId = profile?.couple_id ?? null;
    const monthStart = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthEnd = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const { data: events = [] } = useCalendarEvents(coupleId, monthStart, monthEnd);

    const eventsWithColor = useMemo(
        () => events.map((e) => ({ ...e, color: categoryColors[e.category] ?? '#95A5A6' })),
        [events]
    );

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const generateCalendarDays = (): CalendarDay[] => {
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
        const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1);
        const days: CalendarDay[] = [];

        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ date: daysInPrevMonth - i, isCurrentMonth: false, isToday: false, events: [] });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayEvents = eventsWithColor.filter((e) => e.date === dateStr);
            const isToday =
                i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            days.push({ date: i, isCurrentMonth: true, isToday, events: dayEvents });
        }
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({ date: i, isCurrentMonth: false, isToday: false, events: [] });
        }
        return days;
    };

    const goToPrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
        setSelectedDate(null);
    };

    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
        setSelectedDate(null);
    };

    const getSelectedDateEvents = () => {
        if (!selectedDate) return [];
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
        return mockEvents.filter(e => e.date === dateStr);
    };

    const calendarDays = generateCalendarDays();
    const selectedEvents = getSelectedDateEvents();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome name="arrow-left" size={20} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>📅 カレンダー</Text>
                <Link href="/calendar-add" asChild>
                    <TouchableOpacity style={styles.addButton}>
                        <FontAwesome name="plus" size={18} color="#FF6B9D" />
                    </TouchableOpacity>
                </Link>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Month Navigation */}
                <View style={styles.monthNav}>
                    <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
                        <FontAwesome name="chevron-left" size={16} color="#666" />
                    </TouchableOpacity>
                    <Text style={styles.monthTitle}>
                        {currentYear}年 {MONTHS[currentMonth]}
                    </Text>
                    <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                        <FontAwesome name="chevron-right" size={16} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Calendar Grid */}
                <View style={styles.calendarCard}>
                    {/* Day Headers */}
                    <View style={styles.dayHeaders}>
                        {DAYS.map((day, index) => (
                            <Text
                                key={day}
                                style={[
                                    styles.dayHeader,
                                    index === 0 && styles.sundayText,
                                    index === 6 && styles.saturdayText,
                                ]}
                            >
                                {day}
                            </Text>
                        ))}
                    </View>

                    {/* Calendar Days */}
                    <View style={styles.daysGrid}>
                        {calendarDays.map((day, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.dayCell,
                                    day.isToday && styles.todayCell,
                                    selectedDate === day.date && day.isCurrentMonth && styles.selectedCell,
                                ]}
                                onPress={() => day.isCurrentMonth && setSelectedDate(day.date)}
                                disabled={!day.isCurrentMonth}
                            >
                                <Text
                                    style={[
                                        styles.dayText,
                                        !day.isCurrentMonth && styles.otherMonthText,
                                        day.isToday && styles.todayText,
                                        selectedDate === day.date && day.isCurrentMonth && styles.selectedText,
                                        index % 7 === 0 && day.isCurrentMonth && styles.sundayText,
                                        index % 7 === 6 && day.isCurrentMonth && styles.saturdayText,
                                    ]}
                                >
                                    {day.date}
                                </Text>
                                {day.events.length > 0 && (
                                    <View style={styles.eventDots}>
                                        {day.events.slice(0, 3).map((event, i) => (
                                            <View
                                                key={i}
                                                style={[styles.eventDot, { backgroundColor: event.color }]}
                                            />
                                        ))}
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Selected Date Events */}
                <View style={styles.eventsSection}>
                    <Text style={styles.eventsSectionTitle}>
                        {selectedDate ? `${currentMonth + 1}月${selectedDate}日の予定` : '日付を選択してください'}
                    </Text>

                    {selectedEvents.length > 0 ? (
                        selectedEvents.map((event) => (
                            <View key={event.id} style={styles.eventCard}>
                                <View style={[styles.eventColor, { backgroundColor: event.color }]} />
                                <View style={styles.eventInfo}>
                                    <Text style={styles.eventTitle}>{event.title}</Text>
                                    <Text style={styles.eventCategory}>
                                        {event.category === 'anniversary' && '💕 記念日'}
                                        {event.category === 'payment' && '💰 支払い'}
                                        {event.category === 'date' && '❤️ デート'}
                                        {event.category === 'task' && '📋 タスク'}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : selectedDate ? (
                        <View style={styles.noEvents}>
                            <Text style={styles.noEventsEmoji}>📭</Text>
                            <Text style={styles.noEventsText}>予定はありません</Text>
                            <Link href="/calendar-add" asChild>
                                <TouchableOpacity style={styles.addEventButton}>
                                    <Text style={styles.addEventButtonText}>+ 予定を追加</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    ) : null}
                </View>

                {/* Upcoming Events */}
                <View style={styles.upcomingSection}>
                    <Text style={styles.upcomingSectionTitle}>📌 今後の予定</Text>
                    {mockEvents.slice(0, 5).map((event) => (
                        <View key={event.id} style={styles.upcomingCard}>
                            <View style={[styles.upcomingColor, { backgroundColor: event.color }]} />
                            <View style={styles.upcomingInfo}>
                                <Text style={styles.upcomingTitle}>{event.title}</Text>
                                <Text style={styles.upcomingDate}>{event.date}</Text>
                            </View>
                        </View>
                    ))}
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
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#FFF9F0',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF0F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 24,
    },
    navButton: {
        padding: 8,
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    calendarCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    dayHeaders: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    dayHeader: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        paddingVertical: 8,
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: (width - 64) / 7,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    todayCell: {
        backgroundColor: '#FFF0F5',
    },
    selectedCell: {
        backgroundColor: '#FF6B9D',
    },
    dayText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
    },
    otherMonthText: {
        color: '#ddd',
    },
    todayText: {
        color: '#FF6B9D',
        fontWeight: '700',
    },
    selectedText: {
        color: '#fff',
    },
    sundayText: {
        color: '#E74C3C',
    },
    saturdayText: {
        color: '#3498DB',
    },
    eventDots: {
        flexDirection: 'row',
        gap: 2,
        marginTop: 2,
    },
    eventDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    eventsSection: {
        marginTop: 24,
        marginHorizontal: 16,
    },
    eventsSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    eventCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    eventColor: {
        width: 4,
        height: 40,
        borderRadius: 2,
        marginRight: 12,
    },
    eventInfo: {
        flex: 1,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    eventCategory: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },
    noEvents: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    noEventsEmoji: {
        fontSize: 40,
        marginBottom: 12,
    },
    noEventsText: {
        fontSize: 15,
        color: '#999',
        marginBottom: 16,
    },
    addEventButton: {
        backgroundColor: '#FF6B9D',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    addEventButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    upcomingSection: {
        marginTop: 24,
        marginHorizontal: 16,
    },
    upcomingSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    upcomingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
    },
    upcomingColor: {
        width: 4,
        height: 32,
        borderRadius: 2,
        marginRight: 12,
    },
    upcomingInfo: {
        flex: 1,
    },
    upcomingTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    upcomingDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
});
