import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

const demoNotifications = [
  { id: "demo-1", title: "مرحباً بك في خدمني", content: "ستظهر هنا تحديثات طلباتك ورسائل الحرفيين.", read: false },
  { id: "demo-2", title: "نصيحة مفيدة", content: "أضف وصفاً واضحاً للطلب لتحصل على عروض أدق.", read: true },
];
type NotificationItem = { id: number | string; title: string; content: string; read: boolean };

export default function NotificationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const notificationsQuery = trpc.notifications.list.useQuery(undefined, { enabled: isAuthenticated });
  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: () => notificationsQuery.refetch() });
  const items: NotificationItem[] = isAuthenticated && notificationsQuery.data ? notificationsQuery.data : demoNotifications;
  return <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
    <View style={styles.header}><Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="arrow.left" size={20} color={colors.foreground} /></Pressable><View><Text style={[styles.title, { color: colors.foreground }]}>الإشعارات</Text><Text style={[styles.subtitle, { color: colors.muted }]}>آخر تحديثات طلباتك</Text></View></View>
    <FlatList data={items} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.list} renderItem={({ item }) => <Pressable onPress={() => { if (isAuthenticated && typeof item.id === "number" && !item.read) markRead.mutate({ id: item.id }); else Alert.alert(item.title, item.content); }} style={[styles.row, { backgroundColor: item.read ? colors.surface : "#E7F5F2", borderColor: colors.border }]}><View style={[styles.icon, { backgroundColor: item.read ? `${colors.primary}12` : colors.primary }]}><IconSymbol name="bell.fill" size={19} color={item.read ? colors.primary : "#FFFFFF"} /></View><View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.rowBody, { color: colors.muted }]}>{item.content}</Text><Text style={[styles.rowTime, { color: colors.muted }]}>{item.read ? "تمت القراءة" : "جديد"}</Text></View>{!item.read && <View style={styles.dot} />}</Pressable>} />
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row-reverse", alignItems: "center", gap: 13, marginTop: 10 },
  back: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 27, fontWeight: "800", textAlign: "right" },
  subtitle: { fontSize: 12, textAlign: "right", marginTop: 4 },
  list: { paddingTop: 20, paddingBottom: 28, gap: 10 },
  row: { minHeight: 91, borderRadius: 17, borderWidth: 1, padding: 13, flexDirection: "row-reverse", alignItems: "center", gap: 11 },
  icon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 13, fontWeight: "800", textAlign: "right" },
  rowBody: { fontSize: 11, lineHeight: 17, textAlign: "right" },
  rowTime: { fontSize: 10, textAlign: "right" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#E26D5C" },
});
