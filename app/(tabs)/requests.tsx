import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

const demoRequests = [
  { id: "demo-1", title: "إصلاح تسرب مياه", pro: "سميرة قادري", date: "اليوم، 16:30", status: "pending", providerId: undefined },
  { id: "demo-2", title: "تركيب مكيف هواء", pro: "مراد حسان", date: "12 سبتمبر، 10:00", status: "confirmed", providerId: undefined },
];
const statusLabel: Record<string, string> = { pending: "قيد التأكيد", confirmed: "مجدولة", completed: "مكتملة", cancelled: "ملغاة", draft: "مسودة" };

export default function RequestsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [filter, setFilter] = useState("الكل");
  const requestsQuery = trpc.requests.list.useQuery(undefined, { enabled: isAuthenticated });
  const filters = ["الكل", "نشطة", "مكتملة"];
  const rows = useMemo(() => {
    if (!isAuthenticated || !requestsQuery.data?.length) return demoRequests;
    return requestsQuery.data.map((item) => ({ id: String(item.id), title: item.subcategory || item.category, pro: item.providerId ? `حرفي رقم ${item.providerId}` : "لم يتم اختيار حرفي", date: item.scheduledAt ? new Date(item.scheduledAt).toLocaleDateString("ar-DZ") : "موعد غير محدد", status: item.status, providerId: item.providerId }));
  }, [isAuthenticated, requestsQuery.data]);
  const visibleRows = rows.filter((item) => filter === "الكل" || (filter === "نشطة" && ["pending", "confirmed"].includes(item.status)) || (filter === "مكتملة" && item.status === "completed"));
  return <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
    <View style={styles.header}><Text style={[styles.title, { color: colors.foreground }]}>طلباتي</Text><Pressable onPress={() => router.push("/request")} style={[styles.addButton, { backgroundColor: colors.primary }]}><IconSymbol name="plus" size={20} color="#FFFFFF" /></Pressable></View>
    <Text style={[styles.subtitle, { color: colors.muted }]}>تابع كل خدماتك في مكان واحد</Text>
    <View style={styles.filters}>{filters.map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, { backgroundColor: filter === item ? colors.primary : colors.surface, borderColor: filter === item ? colors.primary : colors.border }]}><Text style={{ color: filter === item ? "#FFFFFF" : colors.muted, fontWeight: "700", fontSize: 12 }}>{item}</Text></Pressable>)}</View>
    <FlatList data={visibleRows} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} renderItem={({ item }) => { const toneColor = item.status === "completed" ? colors.success : item.status === "confirmed" ? colors.primary : item.status === "cancelled" ? colors.error : colors.warning; return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><Pressable onPress={() => Alert.alert(item.title, `تفاصيل طلبك مع ${item.pro}`)}><View style={styles.cardTop}><View style={[styles.status, { backgroundColor: `${toneColor}18` }]}><Text style={[styles.statusText, { color: toneColor }]}>{statusLabel[item.status] ?? item.status}</Text></View><View style={[styles.serviceIcon, { backgroundColor: `${colors.primary}16` }]}><IconSymbol name="wrench.and.screwdriver.fill" size={22} color={colors.primary} /></View></View><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.cardMeta, { color: colors.muted }]}>{item.pro}</Text><View style={styles.cardFooter}><Text style={[styles.cardMeta, { color: colors.muted }]}>{item.date}</Text><Text style={[styles.details, { color: colors.primary }]}>التفاصيل ←</Text></View></Pressable>{item.status === "completed" && item.providerId && <Pressable onPress={() => router.push({ pathname: "/review", params: { requestId: item.id, providerName: item.pro } })} style={[styles.reviewButton, { backgroundColor: `${colors.primary}12` }]}><IconSymbol name="star.fill" size={15} color={colors.primary} /><Text style={[styles.reviewButtonText, { color: colors.primary }]}>قيّم الحرفي</Text></Pressable>}</View>; }} />
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  title: { fontSize: 27, fontWeight: "800", textAlign: "right" }, subtitle: { textAlign: "right", fontSize: 13, marginTop: 5 }, addButton: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" }, filters: { flexDirection: "row-reverse", gap: 8, marginTop: 25, marginBottom: 8 }, filter: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 10 }, list: { gap: 12, paddingTop: 12, paddingBottom: 24 }, card: { borderRadius: 19, borderWidth: 1, padding: 16, gap: 10 }, cardTop: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }, serviceIcon: { width: 45, height: 45, borderRadius: 14, alignItems: "center", justifyContent: "center" }, status: { paddingVertical: 7, paddingHorizontal: 10, borderRadius: 10 }, statusText: { fontSize: 11, fontWeight: "800" }, cardTitle: { fontSize: 16, fontWeight: "800", textAlign: "right", marginTop: 7 }, cardMeta: { fontSize: 12, textAlign: "right" }, cardFooter: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginTop: 3 }, details: { fontSize: 12, fontWeight: "800" }, reviewButton: { height: 38, borderRadius: 11, flexDirection: "row-reverse", justifyContent: "center", alignItems: "center", gap: 7 }, reviewButtonText: { fontSize: 12, fontWeight: "800" },
});
