import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const conversations = [
  { id: "1", name: "سميرة قادري", role: "سباكة وصيانة", message: "أقدر أكون عندك اليوم بعد الرابعة", time: "16:12", initials: "سق", color: "#D97706", unread: true },
  { id: "2", name: "فريق خدمني", role: "الدعم والمساعدة", message: "كيف يمكننا مساعدتك؟", time: "أمس", initials: "خ", color: "#0F766E", unread: false },
  { id: "3", name: "مراد حسان", role: "تركيب مكيفات", message: "تم تأكيد موعد الزيارة", time: "الثلاثاء", initials: "مح", color: "#1D4ED8", unread: false },
];

export default function MessagesScreen() {
  const colors = useColors();
  return <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
    <View style={styles.header}><Text style={[styles.title, { color: colors.foreground }]}>الرسائل</Text><Pressable onPress={() => Alert.alert("محادثة جديدة", "اختر حرفياً من قائمة الخدمات لبدء محادثة.")}><IconSymbol name="plus" size={24} color={colors.primary} /></Pressable></View>
    <Text style={[styles.subtitle, { color: colors.muted }]}>تواصل مباشرة مع فريقك وحرفييك</Text>
    <FlatList data={conversations} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} renderItem={({ item }) => <Pressable onPress={() => Alert.alert(item.name, item.message)} style={({ pressed }) => [styles.row, { borderBottomColor: colors.border }, pressed && { opacity: 0.75 }]}>
      <View style={styles.rowBody}><View style={styles.rowTop}><Text style={[styles.time, { color: item.unread ? colors.primary : colors.muted }]}>{item.time}</Text><Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text></View><Text style={[styles.role, { color: colors.primary }]}>{item.role}</Text><Text numberOfLines={1} style={[styles.message, { color: colors.muted }]}>{item.message}</Text></View>
      <View style={[styles.avatar, { backgroundColor: item.color }]}><Text style={styles.avatarText}>{item.initials}</Text>{item.unread && <View style={[styles.unread, { borderColor: colors.background }]} />}</View>
    </Pressable>} />
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  title: { fontSize: 27, fontWeight: "800", textAlign: "right" },
  subtitle: { textAlign: "right", fontSize: 13, marginTop: 5 },
  list: { paddingTop: 24, paddingBottom: 24 },
  row: { minHeight: 88, paddingVertical: 16, borderBottomWidth: 1, flexDirection: "row-reverse", alignItems: "center", gap: 12 },
  rowBody: { flex: 1, gap: 4 },
  rowTop: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "800" },
  time: { fontSize: 11, fontWeight: "700" },
  role: { fontSize: 11, fontWeight: "700", textAlign: "right" },
  message: { fontSize: 12, textAlign: "right" },
  avatar: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", position: "relative" },
  avatarText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  unread: { position: "absolute", width: 10, height: 10, borderRadius: 5, backgroundColor: "#E26D5C", top: -2, left: -2, borderWidth: 2 },
});
