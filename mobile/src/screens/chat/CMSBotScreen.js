import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import api from '../../core/network/api';
import { getUser, getUserRole } from '../../core/storage/authStorage';

const PROMPT_SUGGESTIONS = [
  'Attendance Summary',
  'Pending Fee Dues',
  'Classes Today',
  'Faculty Directory',
  'Upcoming Exams',
];

function cleanText(txt) {
  if (!txt) return '';
  return txt.replace(/\*\*/g, '').replace(/###/g, '').trim();
}

export default function CMSBotScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('student');
  const scrollViewRef = useRef(null);

  useEffect(() => {
    (async () => {
      const u = await getUser();
      const r = await getUserRole();
      setUser(u);
      setRole(r || 'student');

      const userName = u?.name || 'User';
      setMessages([
        {
          id: 1,
          sender: 'bot',
          text: `Hi ${userName}! I am CMSBot, your VSCMS ERP AI Assistant.\n\nAsk me anything about your real-time attendance %, pending fee dues, class timetable, grades, or faculty details!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    })();
  }, []);

  const handleSend = async (customQuery) => {
    const query = (typeof customQuery === 'string' ? customQuery : input).trim();
    if (!query || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (typeof customQuery !== 'string') setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chat', {
        message: query,
        query: query,
        role: role,
        contextJson: JSON.stringify({
          role,
          userName: user?.name,
          department: user?.department,
        }),
      });

      const replyText = res.data?.reply || res.data?.message || 'I have checked the ERP database for your query.';

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mode: res.data?.mode || 'groq',
        },
      ]);
    } catch (err) {
      console.log('CMSBot Chat error:', err.response?.data || err.message);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: '⚠️ Unable to connect to CMSBot AI engine. Please verify network connection or try again.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="dark" />
      {/* Top Banner */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 24) + SPACING.xs }]}>
        <View style={styles.botBadge}>
          <Ionicons name="sparkles" size={16} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.botTitle}>CMSBot AI Assistant</Text>
          <Text style={styles.botStatus}>Connected to Live Database Context</Text>
        </View>
      </View>

      {/* Messages List - Fixed flex:1 */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <View
              key={msg.id}
              style={[
                styles.messageContainer,
                isUser ? styles.userContainer : styles.botContainer,
              ]}
            >
              {!isUser && (
                <View style={styles.botAvatar}>
                  <Ionicons name="sparkles" size={12} color="#fff" />
                </View>
              )}
              <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
                <Text style={[styles.msgText, isUser ? styles.userMsgText : styles.botMsgText]}>
                  {cleanText(msg.text)}
                </Text>
                <Text style={[styles.timeText, isUser ? styles.userTimeText : styles.botTimeText]}>
                  {msg.time} {msg.mode ? `• ${msg.mode.toUpperCase()}` : ''}
                </Text>
              </View>
            </View>
          );
        })}

        {loading && (
          <View style={[styles.messageContainer, styles.botContainer]}>
            <View style={styles.botAvatar}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
            <View style={[styles.bubble, styles.botBubble]}>
              <Text style={styles.botMsgText}>CMSBot is searching database context...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Prompt Suggestions - Fixed Height Container */}
      <View style={styles.suggestionsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsRow}>
          {PROMPT_SUGGESTIONS.map((p) => (
            <TouchableOpacity key={p} style={styles.chip} activeOpacity={0.7} onPress={() => handleSend(p)}>
              <Ionicons name="chatbubble-ellipses-outline" size={13} color={COLORS.primary} />
              <Text style={styles.chipText}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask CMSBot anything..."
          placeholderTextColor={COLORS.disabled}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => handleSend()}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={() => handleSend()} disabled={loading}>
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topHeader: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: COLORS.border, gap: SPACING.sm },
  botBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  botTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text },
  botStatus: { fontSize: FONT_SIZES.xs, color: COLORS.success, fontWeight: '600' },

  messagesList: { padding: SPACING.md, paddingBottom: SPACING.md },
  messageContainer: { marginBottom: SPACING.sm, width: '100%', flexDirection: 'row', alignItems: 'flex-start' },
  userContainer: { justifyContent: 'flex-end' },
  botContainer: { justifyContent: 'flex-start', gap: 6 },

  botAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  
  bubble: { maxWidth: '80%', padding: SPACING.md, borderRadius: RADIUS.md },
  userBubble: { backgroundColor: COLORS.primary, borderBottomRightRadius: 2 },
  botBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 2, ...SHADOWS.sm },

  msgText: { fontSize: FONT_SIZES.sm, lineHeight: 20 },
  userMsgText: { color: '#fff' },
  botMsgText: { color: COLORS.text },
  timeText: { fontSize: 10, marginTop: 4 },
  userTimeText: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  botTimeText: { color: COLORS.textMuted },

  suggestionsContainer: { height: 46, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border, justifyContent: 'center' },
  suggestionsRow: { paddingHorizontal: SPACING.md, alignItems: 'center', gap: SPACING.xs },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#bfdbfe', height: 32, gap: 4 },
  chipText: { fontSize: FONT_SIZES.xs, color: COLORS.primary, fontWeight: '600' },

  inputBar: { flexDirection: 'row', padding: SPACING.sm, backgroundColor: '#fff', borderTopWidth: 1, borderColor: COLORS.border, gap: SPACING.xs },
  textInput: { flex: 1, height: 44, backgroundColor: COLORS.surfaceVariant, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, fontSize: FONT_SIZES.sm, color: COLORS.text },
  sendBtn: { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
});
