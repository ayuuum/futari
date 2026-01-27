import { ThemeColors } from '@/constants/themes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useCouple } from '@/lib/queries';
import { useAuthStore } from '@/stores/authStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '@/lib/supabase';

function toDateString(d: Date): string {
    return d.toISOString().slice(0, 10);
}
function parseDateString(s: string): Date {
    if (!s) return new Date();
    const parsed = new Date(s);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default function CoupleSettingsScreen() {
    const { theme, isDark } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { profile } = useAuthStore();
    const coupleId = profile?.couple_id ?? null;
    const { data: couple } = useCouple(coupleId);

    const [coupleName, setCoupleName] = useState('');
    const [anniversary, setAnniversary] = useState('');
    const [cohabitationDate, setCohabitationDate] = useState('');
    const [saving, setSaving] = useState(false);
    const [datePickerMode, setDatePickerMode] = useState<'anniversary' | 'cohabitation' | null>(null);
    const [pickerDate, setPickerDate] = useState(new Date());

    useEffect(() => {
        if (couple) {
            setCoupleName(couple.name ?? '');
            setAnniversary(couple.anniversary_date ?? '');
            setCohabitationDate(couple.started_living_date ?? '');
        }
    }, [couple]);

    const handleSave = async () => {
        if (!coupleId) return;
        setSaving(true);
        try {
            await supabase
                .from('couples')
                .update({
                    name: coupleName.trim() || null,
                    anniversary_date: anniversary || null,
                    started_living_date: cohabitationDate || null,
                })
                .eq('id', coupleId);
            router.back();
        } catch (e: any) {
            Alert.alert('エラー', e?.message ?? '保存に失敗しました');
        }
        setSaving(false);
    };

    const openDatePicker = (field: 'anniversary' | 'cohabitation') => {
        const value = field === 'anniversary' ? anniversary : cohabitationDate;
        setPickerDate(parseDateString(value));
        setDatePickerMode(field);
    };

    const onDateChange = (_event: any, date: Date | undefined) => {
        if (date == null) return;
        setPickerDate(date);
        if (Platform.OS === 'android') {
            const str = toDateString(date);
            if (datePickerMode === 'anniversary') setAnniversary(str);
            if (datePickerMode === 'cohabitation') setCohabitationDate(str);
            setDatePickerMode(null);
        }
    };

    const confirmDatePicker = () => {
        const str = toDateString(pickerDate);
        if (datePickerMode === 'anniversary') setAnniversary(str);
        if (datePickerMode === 'cohabitation') setCohabitationDate(str);
        setDatePickerMode(null);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome name="arrow-left" size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>カップル情報</Text>
                <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={saving}>
                    <Text style={[styles.saveButtonText, { color: theme.primary }]}>{saving ? '保存中...' : '保存'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.heroSection}>
                    <View style={[styles.iconCircle, { backgroundColor: theme.primary + '15' }]}>
                        <FontAwesome name="heart" size={40} color={theme.primary} />
                    </View>
                    <Text style={styles.heroTitle}>ふたりの情報</Text>
                    <Text style={styles.heroSubtitle}>記念日や思い出の日を管理しましょう</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>カップル名 / 呼び名</Text>
                        <TextInput
                            style={styles.input}
                            value={coupleName}
                            onChangeText={setCoupleName}
                            placeholder="例: Ayumu & Partner"
                            placeholderTextColor={theme.textMuted}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>記念日 (付き合い始めた日)</Text>
                        <TouchableOpacity style={styles.datePickerButton} onPress={() => openDatePicker('anniversary')}>
                            <Text style={[styles.dateText, !anniversary && { color: theme.textMuted }]}>
                                {anniversary || '日付を選択'}
                            </Text>
                            <FontAwesome name="calendar" size={16} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>同棲開始日</Text>
                        <TouchableOpacity style={styles.datePickerButton} onPress={() => openDatePicker('cohabitation')}>
                            <Text style={[styles.dateText, !cohabitationDate && { color: theme.textMuted }]}>
                                {cohabitationDate || '日付を選択'}
                            </Text>
                            <FontAwesome name="calendar" size={16} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {datePickerMode !== null && (
                    Platform.OS === 'ios' ? (
                        <Modal visible transparent animationType="slide">
                            <TouchableOpacity
                                style={styles.datePickerOverlay}
                                activeOpacity={1}
                                onPress={() => setDatePickerMode(null)}
                            >
                                <View style={styles.datePickerModal}>
                                    <View style={styles.datePickerHeader}>
                                        <TouchableOpacity onPress={confirmDatePicker}>
                                            <Text style={[styles.datePickerDone, { color: theme.primary }]}>完了</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <DateTimePicker
                                        value={pickerDate}
                                        mode="date"
                                        display="spinner"
                                        onChange={onDateChange}
                                        maximumDate={new Date()}
                                    />
                                </View>
                            </TouchableOpacity>
                        </Modal>
                    ) : (
                        <DateTimePicker
                            value={pickerDate}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                            maximumDate={new Date()}
                        />
                    )
                )}

                <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>共有される情報</Text>
                    <Text style={styles.infoDescription}>
                        ここで設定した情報は、ホーム画面や月次レポートの表示、記念日のリマインダーに使用されます。
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const createStyles = (theme: ThemeColors, isDark: boolean) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: Platform.OS === 'ios' ? 60 : 40,
            paddingBottom: 16,
            backgroundColor: theme.card,
        },
        backButton: {
            padding: 8,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.text,
        },
        saveButton: {
            padding: 8,
        },
        saveButtonText: {
            fontSize: 16,
            fontWeight: '600',
        },
        content: {
            flex: 1,
        },
        heroSection: {
            alignItems: 'center',
            padding: 32,
            backgroundColor: theme.card,
            marginBottom: 16,
        },
        iconCircle: {
            width: 80,
            height: 80,
            borderRadius: 40,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
        },
        heroTitle: {
            fontSize: 24,
            fontWeight: '800',
            color: theme.text,
            marginBottom: 8,
        },
        heroSubtitle: {
            fontSize: 14,
            color: theme.textSecondary,
            textAlign: 'center',
        },
        form: {
            padding: 16,
            backgroundColor: theme.card,
            marginBottom: 16,
        },
        inputGroup: {
            marginBottom: 24,
        },
        label: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.textSecondary,
            marginBottom: 8,
        },
        input: {
            backgroundColor: theme.background,
            borderRadius: 12,
            padding: 14,
            fontSize: 16,
            color: theme.text,
            borderWidth: isDark ? 1 : 0,
            borderColor: theme.border,
        },
        datePickerButton: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: theme.background,
            borderRadius: 12,
            padding: 14,
            borderWidth: isDark ? 1 : 0,
            borderColor: theme.border,
        },
        dateText: {
            fontSize: 16,
            color: theme.text,
        },
        infoSection: {
            padding: 24,
        },
        infoTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: theme.text,
            marginBottom: 8,
        },
        infoDescription: {
            fontSize: 14,
            color: theme.textSecondary,
            lineHeight: 20,
        },
        datePickerOverlay: {
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.4)',
        },
        datePickerModal: {
            backgroundColor: theme.card,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        },
        datePickerHeader: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        datePickerDone: {
            fontSize: 16,
            fontWeight: '600',
        },
    });
