import { useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const requests = [
  { id: "1", title: "إصلاح تسرب مياه", pro: "سميرة قادري", date: "اليوم، 16:30", status: "قيد التأكيد", tone: "warning" },
  { id: "2", title: "تركيب مكيف هواء", pro: "مراد حسان", date: "12 سبتمبر، 10:00", status: "مجدولة", tone: "success" },
  { id: "3", title: "طلاء غرفة المعيشة", pro: "لم يتم اختيار حرفي", date: "مسودة", status: "مسودة", tone: "muted" },
];

export default function RequestsScreen() {
  const colors = useColors();
  const [filter, setFilter] = useState("الكل");
  const filters = ["الكل", "نشطة", "مكتملة"];
  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <View style={styles.header}><Text style={[styles.title, { color: colors.foreground }]}>طلباتي</Text><Pressable onPress={() => Alert.alert("طلب جديد", "اختر نوع الخدمة من الرئيسية لبدء طلب جديد.")} style={[styles.addButton, { backgroundColor: colors.primary }]}><IconSymbol name="plus" size={20} color="#FFFFFF" /></Pressable></View>
      <Text style={[styles.subtitle, { color: colors.muted }]}>تابع كل خدماتك في مكان واحد</Text>
      <View style={styles.filters}>{filters.map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, { backgroundColor: filter === item ? colors.primary : colors.surface, borderColor: filter === item ? colors.primary : colors.border }]}><Text style={{ color: filter === item ? "#FFFFFF" : colors.muted, fontWeight: "700", fontSize: 12 }}>{item}</Text></Pressable>)}</View>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const toneColor = item.tone === "success" ? colors.success : item.tone === "warning" ? colors.warning : colors.muted;
          return <Pressable onPress={() => Alert.alert(item.title, `تفاصيل طلبك مع ${item.pro}`)} style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.8 }]}>
            <View style={styles.cardTop}><View style={[styles.status, { backgroundColor: `${toneColor}18` }]}><Text style={[styles.statusText, { color: toneColor }]}>{item.status}</Text></View><View style={[styles.serviceIcon, { backgroundColor: `${colors.primary}16` }]}><IconSymbol name="wrench.and.screwdriver.fill" size={22} color={colors.primary} /></View></View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
            <Text style={[styles.cardMeta, { color: colors.muted }]}>{item.pro}</Text>
            <View style={styles.cardFooter}><Text style={[styles.cardMeta, { color: colors.muted }]}>{item.date}</Text><Text style={[styles.details, { color: colors.primary }]}>التفاصيل ←</Text></View>
          </Pressable>;
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  title: { fontSize: 27, fontWeight: "800", textAlign: "right" },
  subtitle: { textAlign: "right", fontSize: 13, marginTop: 5 },
  addButton: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  filters: { flexDirection: "row-reverse", gap: 8, marginTop: 25, marginBottom: 8 },
  filter: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 10 },
  list: { gap: 12, paddingTop: 12, paddingBottom: 24 },
  card: { borderRadius: 19, borderWidth: 1, padding: 16, gap: 8 },
  cardTop: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  serviceIcon: { width: 45, height: 45, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  status: { paddingVertical: 7, paddingHorizontal: 10, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: "800" },
  cardTitle: { fontSize: 16, fontWeight: "800", textAlign: "right", marginTop: 7 },
  cardMeta: { fontSize: 12, textAlign: "right" },
  cardFooter: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  details: { fontSize: 12, fontWeight: "800" },
});
