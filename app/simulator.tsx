import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
} from 'react-native';
import { Stack } from 'expo-router';
import Slider from '@react-native-community/slider';

export default function SimulatorScreen() {
    const [rent, setRent] = useState('100000');
    const [depositMonths, setDepositMonths] = useState(1);
    const [keyMoneyMonths, setKeyMoneyMonths] = useState(1);
    const [agencyFeeRate, setAgencyFeeRate] = useState(1);
    const [movingCost, setMovingCost] = useState('50000');
    const [furnitureBudget, setFurnitureBudget] = useState('150000');
    const [splitRatio, setSplitRatio] = useState(0.5);

    const rentNum = parseInt(rent) || 0;
    const movingNum = parseInt(movingCost) || 0;
    const furnitureNum = parseInt(furnitureBudget) || 0;

    // Calculate costs
    const deposit = rentNum * depositMonths;
    const keyMoney = rentNum * keyMoneyMonths;
    const agencyFee = rentNum * agencyFeeRate;
    const totalInitial = deposit + keyMoney + agencyFee + movingNum + furnitureNum;

    const myShare = Math.round(totalInitial * splitRatio);
    const partnerShare = totalInitial - myShare;

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('ja-JP');
    };

    return (
        <>
            <Stack.Screen
                options={{
                    title: '初期費用シミュレーター',
                    headerStyle: { backgroundColor: '#FFF9F0' },
                    headerShadowVisible: false,
                }}
            />
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Result Card */}
                <View style={styles.resultCard}>
                    <Text style={styles.resultLabel}>初期費用の合計</Text>
                    <Text style={styles.resultAmount}>¥{formatCurrency(totalInitial)}</Text>

                    <View style={styles.sharePreview}>
                        <View style={styles.shareItem}>
                            <View style={[styles.avatar, { backgroundColor: '#FF6B9D' }]}>
                                <Text style={styles.avatarText}>あ</Text>
                            </View>
                            <Text style={styles.shareName}>あなた</Text>
                            <Text style={styles.shareAmount}>¥{formatCurrency(myShare)}</Text>
                        </View>
                        <View style={styles.shareItem}>
                            <View style={[styles.avatar, { backgroundColor: '#4ECDC4' }]}>
                                <Text style={styles.avatarText}>パ</Text>
                            </View>
                            <Text style={styles.shareName}>パートナー</Text>
                            <Text style={styles.shareAmount}>¥{formatCurrency(partnerShare)}</Text>
                        </View>
                    </View>
                </View>

                {/* Input Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🏠 物件情報</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>家賃（月額）</Text>
                        <View style={styles.currencyInputWrapper}>
                            <Text style={styles.currencyPrefix}>¥</Text>
                            <TextInput
                                style={styles.currencyInput}
                                value={rent}
                                onChangeText={setRent}
                                keyboardType="numeric"
                                placeholder="0"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>敷金</Text>
                            <Text style={styles.labelValue}>{depositMonths}ヶ月分 = ¥{formatCurrency(deposit)}</Text>
                        </View>
                        <View style={styles.sliderContainer}>
                            <Slider
                                style={styles.slider}
                                minimumValue={0}
                                maximumValue={3}
                                step={0.5}
                                value={depositMonths}
                                onValueChange={setDepositMonths}
                                minimumTrackTintColor="#FF6B9D"
                                maximumTrackTintColor="#ddd"
                                thumbTintColor="#FF6B9D"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>礼金</Text>
                            <Text style={styles.labelValue}>{keyMoneyMonths}ヶ月分 = ¥{formatCurrency(keyMoney)}</Text>
                        </View>
                        <View style={styles.sliderContainer}>
                            <Slider
                                style={styles.slider}
                                minimumValue={0}
                                maximumValue={3}
                                step={0.5}
                                value={keyMoneyMonths}
                                onValueChange={setKeyMoneyMonths}
                                minimumTrackTintColor="#FF6B9D"
                                maximumTrackTintColor="#ddd"
                                thumbTintColor="#FF6B9D"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>仲介手数料</Text>
                            <Text style={styles.labelValue}>{agencyFeeRate}ヶ月分 = ¥{formatCurrency(agencyFee)}</Text>
                        </View>
                        <View style={styles.sliderContainer}>
                            <Slider
                                style={styles.slider}
                                minimumValue={0}
                                maximumValue={1.5}
                                step={0.5}
                                value={agencyFeeRate}
                                onValueChange={setAgencyFeeRate}
                                minimumTrackTintColor="#FF6B9D"
                                maximumTrackTintColor="#ddd"
                                thumbTintColor="#FF6B9D"
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📦 引っ越し・家具</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>引っ越し費用</Text>
                        <View style={styles.currencyInputWrapper}>
                            <Text style={styles.currencyPrefix}>¥</Text>
                            <TextInput
                                style={styles.currencyInput}
                                value={movingCost}
                                onChangeText={setMovingCost}
                                keyboardType="numeric"
                                placeholder="0"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>家具・家電予算</Text>
                        <View style={styles.currencyInputWrapper}>
                            <Text style={styles.currencyPrefix}>¥</Text>
                            <TextInput
                                style={styles.currencyInput}
                                value={furnitureBudget}
                                onChangeText={setFurnitureBudget}
                                keyboardType="numeric"
                                placeholder="0"
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💑 負担割合</Text>

                    <View style={styles.splitSliderContainer}>
                        <View style={styles.splitLabels}>
                            <Text style={styles.splitLabel}>あなた</Text>
                            <Text style={styles.splitPercentage}>{Math.round(splitRatio * 100)}:{Math.round((1 - splitRatio) * 100)}</Text>
                            <Text style={styles.splitLabel}>パートナー</Text>
                        </View>
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={1}
                            step={0.05}
                            value={splitRatio}
                            onValueChange={setSplitRatio}
                            minimumTrackTintColor="#FF6B9D"
                            maximumTrackTintColor="#4ECDC4"
                            thumbTintColor="#fff"
                        />
                        <View style={styles.splitAmounts}>
                            <Text style={styles.splitAmount}>¥{formatCurrency(myShare)}</Text>
                            <Text style={styles.splitAmount}>¥{formatCurrency(partnerShare)}</Text>
                        </View>
                    </View>
                </View>

                {/* Cost Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📊 内訳</Text>

                    <View style={styles.breakdownItem}>
                        <Text style={styles.breakdownLabel}>敷金</Text>
                        <Text style={styles.breakdownAmount}>¥{formatCurrency(deposit)}</Text>
                    </View>
                    <View style={styles.breakdownItem}>
                        <Text style={styles.breakdownLabel}>礼金</Text>
                        <Text style={styles.breakdownAmount}>¥{formatCurrency(keyMoney)}</Text>
                    </View>
                    <View style={styles.breakdownItem}>
                        <Text style={styles.breakdownLabel}>仲介手数料</Text>
                        <Text style={styles.breakdownAmount}>¥{formatCurrency(agencyFee)}</Text>
                    </View>
                    <View style={styles.breakdownItem}>
                        <Text style={styles.breakdownLabel}>引っ越し費用</Text>
                        <Text style={styles.breakdownAmount}>¥{formatCurrency(movingNum)}</Text>
                    </View>
                    <View style={styles.breakdownItem}>
                        <Text style={styles.breakdownLabel}>家具・家電</Text>
                        <Text style={styles.breakdownAmount}>¥{formatCurrency(furnitureNum)}</Text>
                    </View>
                    <View style={[styles.breakdownItem, styles.breakdownTotal]}>
                        <Text style={styles.breakdownTotalLabel}>合計</Text>
                        <Text style={styles.breakdownTotalAmount}>¥{formatCurrency(totalInitial)}</Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF9F0',
    },
    resultCard: {
        backgroundColor: '#FF6B9D',
        margin: 16,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    resultLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 8,
    },
    resultAmount: {
        color: '#fff',
        fontSize: 36,
        fontWeight: '700',
        marginBottom: 20,
    },
    sharePreview: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        justifyContent: 'space-around',
    },
    shareItem: {
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    avatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    shareName: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginBottom: 4,
    },
    shareAmount: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    section: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    labelValue: {
        fontSize: 14,
        color: '#FF6B9D',
        fontWeight: '600',
    },
    currencyInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 16,
    },
    currencyPrefix: {
        fontSize: 18,
        color: '#999',
        marginRight: 8,
    },
    currencyInput: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        paddingVertical: 14,
        color: '#333',
    },
    sliderContainer: {
        paddingHorizontal: 8,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    splitSliderContainer: {
        paddingHorizontal: 8,
    },
    splitLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    splitLabel: {
        fontSize: 14,
        color: '#666',
    },
    splitPercentage: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    splitAmounts: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    splitAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    breakdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    breakdownLabel: {
        fontSize: 14,
        color: '#666',
    },
    breakdownAmount: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    breakdownTotal: {
        borderBottomWidth: 0,
        marginTop: 8,
    },
    breakdownTotalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    breakdownTotalAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FF6B9D',
    },
});
