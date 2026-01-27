import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const FAQ_DATA = [
    {
        id: '1',
        question: 'パートナーを招待するには？',
        answer:
            '設定画面の「パートナーを招待」から、招待コードを共有できます。パートナーがアプリをダウンロードし、コードを入力すればマッチング完了です。',
        category: 'partner',
    },
    {
        id: '2',
        question: '支出の負担割合を変更したい',
        answer:
            '設定画面の「負担割合」から、支出や家事の分担比率を変更できます。50:50以外にも、60:40など自由に設定可能です。',
        category: 'expense',
    },
    {
        id: '3',
        question: 'データはどこに保存されますか？',
        answer:
            'データはクラウド上に安全に暗号化されて保存されます。パートナー以外の第三者がデータにアクセスすることはできません。',
        category: 'privacy',
    },
    {
        id: '4',
        question: '通知が届かない',
        answer:
            '端末の設定からFutariアプリの通知を許可してください。また、アプリ内の「通知設定」でオンになっているか確認してください。',
        category: 'notification',
    },
    {
        id: '5',
        question: '同棲を解消した場合は？',
        answer:
            'カップル情報の設定から連携を解除できます。解除後もあなたのデータは残りますが、パートナーとの共有は停止されます。',
        category: 'partner',
    },
    {
        id: '6',
        question: '月次レポートはいつ届きますか？',
        answer:
            '月次レポートは毎月1日に生成されます。アプリ内のレポート画面からいつでも確認できます。',
        category: 'report',
    },
];

interface FAQItemProps {
    question: string;
    answer: string;
    isExpanded: boolean;
    onPress: () => void;
}

function FAQItem({ question, answer, isExpanded, onPress }: FAQItemProps) {
    return (
        <TouchableOpacity style={styles.faqItem} onPress={onPress}>
            <View style={styles.faqQuestion}>
                <Text style={styles.faqQuestionText}>{question}</Text>
                <FontAwesome
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color="#999"
                />
            </View>
            {isExpanded && (
                <Text style={styles.faqAnswer}>{answer}</Text>
            )}
        </TouchableOpacity>
    );
}

export default function HelpScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filteredFAQ = searchQuery
        ? FAQ_DATA.filter(
            (item) =>
                item.question.includes(searchQuery) || item.answer.includes(searchQuery)
        )
        : FAQ_DATA;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome name="arrow-left" size={20} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>❓ ヘルプ</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Search */}
                <View style={styles.searchContainer}>
                    <FontAwesome name="search" size={16} color="#999" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="質問を検索..."
                        placeholderTextColor="#ccc"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* FAQ Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>よくある質問</Text>
                    <View style={styles.faqList}>
                        {filteredFAQ.map((item) => (
                            <FAQItem
                                key={item.id}
                                question={item.question}
                                answer={item.answer}
                                isExpanded={expandedId === item.id}
                                onPress={() =>
                                    setExpandedId(expandedId === item.id ? null : item.id)
                                }
                            />
                        ))}
                    </View>
                </View>

                {/* Contact Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>お問い合わせ</Text>
                    <View style={styles.contactList}>
                        <TouchableOpacity style={styles.contactItem}>
                            <View style={[styles.contactIcon, { backgroundColor: '#FF6B9D15' }]}>
                                <FontAwesome name="envelope" size={18} color="#FF6B9D" />
                            </View>
                            <View style={styles.contactContent}>
                                <Text style={styles.contactTitle}>メールで問い合わせ</Text>
                                <Text style={styles.contactDescription}>support@futari.app</Text>
                            </View>
                            <FontAwesome name="chevron-right" size={14} color="#ccc" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.contactItem}>
                            <View style={[styles.contactIcon, { backgroundColor: '#1DA1F215' }]}>
                                <FontAwesome name="twitter" size={18} color="#1DA1F2" />
                            </View>
                            <View style={styles.contactContent}>
                                <Text style={styles.contactTitle}>X (Twitter)</Text>
                                <Text style={styles.contactDescription}>@FutariApp</Text>
                            </View>
                            <FontAwesome name="chevron-right" size={14} color="#ccc" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity style={styles.quickAction}>
                        <FontAwesome name="book" size={20} color="#4ECDC4" />
                        <Text style={styles.quickActionText}>使い方ガイド</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickAction}>
                        <FontAwesome name="bug" size={20} color="#FFB347" />
                        <Text style={styles.quickActionText}>不具合を報告</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickAction}>
                        <FontAwesome name="lightbulb-o" size={20} color="#9B59B6" />
                        <Text style={styles.quickActionText}>機能をリクエスト</Text>
                    </TouchableOpacity>
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#333',
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginLeft: 16,
        marginBottom: 12,
    },
    faqList: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    faqItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    faqQuestion: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestionText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
        marginRight: 12,
    },
    faqAnswer: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
    },
    contactList: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    contactIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactContent: {
        flex: 1,
        marginLeft: 12,
    },
    contactTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
    },
    contactDescription: {
        fontSize: 13,
        color: '#999',
        marginTop: 2,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginHorizontal: 16,
        marginTop: 24,
        gap: 12,
    },
    quickAction: {
        flex: 1,
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        gap: 8,
    },
    quickActionText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#666',
    },
});
