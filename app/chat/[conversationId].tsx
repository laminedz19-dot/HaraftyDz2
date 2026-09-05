import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

export default function ChatScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { conversationId, providerId, name } = useLocalSearchParams<{ conversationId: string; providerId?: string; name?: string }>();
  const activeConversationId = conversationId?.includes("-customer-") ? conversationId : user && providerId ? `provider-${providerId}-customer-${user.id}` : conversationId || "";
  const [text, setText] = useState("");
  const providerQuery = trpc.providers.get.useQuery({ id: Number(providerId) }, { enabled: Boolean(providerId) });
  const messagesQuery = trpc.chat.messages.useQuery({ conversationId: activeConversationId }, { enabled: isAuthenticated && Boolean(activeConversationId), refetchInterval: 6000 });
  const send = trpc.chat.send.useMutation({ onSuccess: () => { setText(""); messagesQuery.refetch(); } });
  const partnerName = name || providerQuery.data?.name || "محادثة خدمني";
  const submit = () => { if (!isAuthenticated) { Alert.alert("التواصل مع الحرفي", "استخدم زر واتساب في بروفايل الحرفي للتواصل مباشرة دون إنشاء حساب."); return; } if (!text.trim() || !providerQuery.data?.userId || !user) return; send.mutate({ conversationId: activeConversationId, receiverId: providerQuery.data.userId, content: text.trim() }); };
  return <ScreenContainer edges={["top", "left", "right"]}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={8}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}><Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="arrow.left" size={20} color={colors.foreground} /></Pressable><View style={styles.partner}><View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={styles.avatarText}>{partnerName.slice(0, 2)}</Text></View><View><Text style={[styles.title, { color: colors.foreground }]}>{partnerName}</Text><Text style={[styles.subtitle, { color: colors.success }]}>متصل بخدمني</Text></View></View></View>
      <ScrollView contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}>{!isAuthenticated ? <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="message.fill" size={24} color={colors.primary} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>التواصل عبر واتساب</Text><Text style={[styles.emptyText, { color: colors.muted }]}>يمكنك التواصل مع الحرفي مباشرة عبر واتساب دون تسجيل أو إنشاء حساب.</Text></View> : messagesQuery.isLoading ? <ActivityIndicator color={colors.primary} /> : (messagesQuery.data || []).map((message) => <View key={message.id} style={[styles.bubble, message.senderId === user?.id ? { backgroundColor: colors.primary, alignSelf: "flex-start" } : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, alignSelf: "flex-end" }]}><Text style={{ color: message.senderId === user?.id ? "#FFFFFF" : colors.foreground, fontSize: 13, textAlign: "right" }}>{message.content}</Text></View>)}</ScrollView>
      <View style={[styles.composer, { borderTopColor: colors.border }]}><Pressable onPress={submit} disabled={send.isPending || !text.trim()} style={[styles.send, { backgroundColor: text.trim() ? colors.primary : colors.border }]}><IconSymbol name="paperplane.fill" size={18} color="#FFFFFF" /></Pressable><TextInput value={text} onChangeText={setText} placeholder="اكتب رسالتك..." placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]} textAlign="right" multiline maxLength={2000} /></View>
    </KeyboardAvoidingView>
  </ScreenContainer>;
}

const styles = StyleSheet.create({ flex: { flex: 1 }, header: { minHeight: 72, borderBottomWidth: 1, paddingHorizontal: 20, flexDirection: "row-reverse", alignItems: "center", gap: 12 }, back: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center" }, partner: { flex: 1, flexDirection: "row-reverse", alignItems: "center", gap: 10 }, avatar: { width: 43, height: 43, borderRadius: 14, alignItems: "center", justifyContent: "center" }, avatarText: { color: "#FFFFFF", fontWeight: "900", fontSize: 13 }, title: { fontSize: 16, fontWeight: "800", textAlign: "right" }, subtitle: { fontSize: 10, textAlign: "right", marginTop: 3 }, messages: { flexGrow: 1, padding: 20, gap: 10, justifyContent: "flex-end" }, bubble: { maxWidth: "78%", paddingHorizontal: 13, paddingVertical: 10, borderRadius: 15 }, empty: { borderWidth: 1, borderRadius: 18, padding: 20, alignItems: "center", gap: 9, alignSelf: "stretch" }, emptyTitle: { fontSize: 16, fontWeight: "800" }, emptyText: { fontSize: 12, lineHeight: 19, textAlign: "center" }, composer: { minHeight: 74, borderTopWidth: 1, padding: 12, flexDirection: "row-reverse", alignItems: "flex-end", gap: 8 }, input: { flex: 1, minHeight: 46, maxHeight: 105, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 10, fontSize: 13 }, send: { width: 45, height: 45, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});
