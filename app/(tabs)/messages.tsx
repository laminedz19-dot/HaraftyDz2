import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

const demo = [{ id: "demo-1", name: "سميرة قادري", role: "سباكة وصيانة", message: "أقدر أكون عندك اليوم بعد الرابعة", time: "16:12", initials: "سق", unread: true, receiverId: undefined }];
type ConversationItem = { id: string; name: string; role: string; message: string; time: string; initials: string; unread: boolean; receiverId?: number };
export default function MessagesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const query = trpc.chat.conversations.useQuery(undefined, { enabled: isAuthenticated });
  const conversations: ConversationItem[] = isAuthenticated && query.data?.length ? query.data.map((item) => ({ id: item.conversationId, name: "محادثة خدمني", role: "عميل أو حرفي", message: item.content, time: new Date(item.createdAt).toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" }), initials: "خ", unread: !item.read && item.receiverId === user?.id, receiverId: item.senderId === user?.id ? item.receiverId : item.senderId })) : demo;
  const open = (item: ConversationItem) => { if (item.id.startsWith("demo")) { Alert.alert("المراسلة", "يمكنك التواصل مع الحرفي بعد إرسال طلب خدمة."); return; } router.push({ pathname: "/chat/[conversationId]", params: { conversationId: item.id, name: item.name } }); };
  return <ScreenContainer className="px-5" edges={["top", "left", "right"]}><View style={styles.header}><Text style={[styles.title, { color: colors.foreground }]}>الرسائل</Text></View><Text style={[styles.subtitle, { color: colors.muted }]}>تواصل مباشرة مع فريقك وحرفييك</Text><FlatList data={conversations} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} renderItem={({ item }) => <Pressable onPress={() => open(item)} style={({ pressed }) => [styles.row, { borderBottomColor: colors.border }, pressed && { opacity: 0.75 }]}><View style={styles.rowBody}><View style={styles.rowTop}><Text style={[styles.time, { color: item.unread ? colors.primary : colors.muted }]}>{item.time}</Text><Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text></View><Text style={[styles.role, { color: colors.primary }]}>{item.role}</Text><Text numberOfLines={1} style={[styles.message, { color: colors.muted }]}>{item.message}</Text></View><View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={styles.avatarText}>{item.initials}</Text>{item.unread && <View style={[styles.unread, { borderColor: colors.background }]} />}</View></Pressable>} /></ScreenContainer>;
}
const styles = StyleSheet.create({ header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginTop: 10 }, title: { fontSize: 27, fontWeight: "800", textAlign: "right" }, subtitle: { textAlign: "right", fontSize: 13, marginTop: 5 }, list: { paddingTop: 24, paddingBottom: 24 }, row: { minHeight: 88, paddingVertical: 16, borderBottomWidth: 1, flexDirection: "row-reverse", alignItems: "center", gap: 12 }, rowBody: { flex: 1, gap: 4 }, rowTop: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }, name: { fontSize: 15, fontWeight: "800" }, time: { fontSize: 11, fontWeight: "700" }, role: { fontSize: 11, fontWeight: "700", textAlign: "right" }, message: { fontSize: 12, textAlign: "right" }, avatar: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", position: "relative" }, avatarText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" }, unread: { position: "absolute", width: 10, height: 10, borderRadius: 5, backgroundColor: "#E26D5C", top: -2, left: -2, borderWidth: 2 },
});
