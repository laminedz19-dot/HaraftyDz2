import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

type CatalogItem = { id: string; label: string; icon: string; sub: string[] };
type Provider = { id: string; name: string; trade: string; category: string; price: string; distance: string; rating: string; initials: string; color: string };

const catalog: CatalogItem[] = [
  { id: "plumbing", label: "سباكة", icon: "drop.fill", sub: ["إصلاح التسربات", "تركيب صنابير", "تسليك المجاري", "سخانات المياه"] },
  { id: "electric", label: "كهرباء", icon: "bolt.fill", sub: ["إصلاح الأعطال", "تمديد كهرباء", "تركيب إنارة", "لوحات كهربائية"] },
  { id: "maintenance", label: "صيانة", icon: "wrench.and.screwdriver.fill", sub: ["صيانة عامة", "إصلاح الأبواب", "أعمال منزلية", "فحص الأعطال"] },
  { id: "painting", label: "دهان", icon: "paintbrush.fill", sub: ["دهان داخلي", "دهان خارجي", "ورق جدران", "دهانات ديكورية"] },
  { id: "ac", label: "تكييف", icon: "snowflake", sub: ["تركيب مكيف", "تنظيف المكيف", "تعبئة الفريون", "صيانة التكييف"] },
  { id: "cleaning", label: "تنظيف", icon: "sparkles", sub: ["تنظيف منازل", "تنظيف عميق", "تنظيف مكاتب", "تنظيف بعد البناء"] },
  { id: "carpentry", label: "نجارة", icon: "hammer.fill", sub: ["إصلاح الأثاث", "أبواب وخزائن", "تفصيل خشب", "تركيب باركيه"] },
  { id: "garden", label: "حدائق", icon: "leaf.fill", sub: ["تنسيق حدائق", "قص الأشجار", "شبكات الري", "زراعة منزلية"] },
  { id: "moving", label: "نقل أثاث", icon: "truck.box.fill", sub: ["نقل داخل المدينة", "تغليف الأثاث", "رفع وتنزيل", "تخزين الأثاث"] },
  { id: "renovation", label: "ترميم", icon: "house.fill", sub: ["ترميم منازل", "إصلاح تشققات", "بناء وتكسير", "تجديد الحمامات"] },
  { id: "pest", label: "مكافحة حشرات", icon: "bug.fill", sub: ["رش الحشرات", "مكافحة النمل", "مكافحة القوارض", "تعقيم المنزل"] },
  { id: "glass", label: "زجاج وألمنيوم", icon: "window.horizontal", sub: ["تركيب نوافذ", "أبواب ألمنيوم", "واجهات زجاجية", "تصليح الزجاج"] },
  { id: "furniture", label: "أثاث ومفروشات", icon: "sofa.fill", sub: ["تنظيف الكنب", "تنجيد الأثاث", "تفصيل ستائر", "تلميع الأثاث"] },
  { id: "appliances", label: "أجهزة منزلية", icon: "washer.fill", sub: ["غسالات", "ثلاجات", "أفران", "مكانس كهربائية"] },
  { id: "tv", label: "تلفاز ورسيفر", icon: "tv.fill", sub: ["تركيب شاشة", "برمجة رسيفر", "هوائيات", "صيانة تلفاز"] },
  { id: "internet", label: "إنترنت وشبكات", icon: "wifi", sub: ["تركيب راوتر", "تمديد شبكات", "تقوية الإشارة", "إعداد الشبكة"] },
  { id: "security", label: "أمن وكاميرات", icon: "video.fill", sub: ["تركيب كاميرات", "أنظمة إنذار", "أقفال ذكية", "صيانة المراقبة"] },
  { id: "solar", label: "طاقة شمسية", icon: "sun.max.fill", sub: ["ألواح شمسية", "بطاريات", "سخانات شمسية", "صيانة الطاقة"] },
  { id: "insulation", label: "عزل الأسطح", icon: "square.stack.3d.up.fill", sub: ["عزل مائي", "عزل حراري", "عزل صوتي", "عزل الخزانات"] },
  { id: "gypsum", label: "جبس وديكور", icon: "text.alignleft", sub: ["أسقف معلقة", "جبس بورد", "إضاءة مخفية", "ديكور جداري"] },
  { id: "kitchens", label: "مطابخ وخزائن", icon: "cabinet.fill", sub: ["مطابخ ألمنيوم", "مطابخ خشب", "خزائن ملابس", "أسطح رخام"] },
  { id: "locks", label: "أقفال ومفاتيح", icon: "lock.fill", sub: ["فتح الأقفال", "نسخ المفاتيح", "أقفال إلكترونية", "تغيير الأقفال"] },
  { id: "car", label: "غسيل سيارات", icon: "car.fill", sub: ["غسيل متنقل", "تلميع السيارة", "تنظيف داخلي", "تلميع المصابيح"] },
  { id: "sewing", label: "خياطة وستائر", icon: "scissors", sub: ["تفصيل ستائر", "تقصير الملابس", "تنجيد", "إصلاح الملابس"] },
  { id: "events", label: "تنظيم مناسبات", icon: "person.2.fill", sub: ["تجهيز حفلات", "ديكور مناسبات", "ضيافة", "تنظيم أعراس"] },
  { id: "photography", label: "تصوير", icon: "camera.fill", sub: ["تصوير مناسبات", "تصوير منتجات", "فيديو", "تصوير عقارات"] },
];

const providers: Provider[] = [
  { id: "1", name: "ياسين بوعلام", trade: "كهربائي معتمد", category: "electric", price: "من 1,500 دج", distance: "1.2 كم", rating: "4.9", initials: "يب", color: "#0F766E" },
  { id: "2", name: "سميرة قادري", trade: "سباكة وصيانة", category: "plumbing", price: "من 1,200 دج", distance: "2.4 كم", rating: "4.8", initials: "سق", color: "#D97706" },
  { id: "3", name: "مراد حسان", trade: "تركيب مكيفات", category: "ac", price: "من 3,000 دج", distance: "3.1 كم", rating: "4.7", initials: "مح", color: "#1D4ED8" },
  { id: "4", name: "نادية مرزوق", trade: "تنظيف وتعقيم", category: "cleaning", price: "من 2,000 دج", distance: "1.8 كم", rating: "4.9", initials: "نم", color: "#9333EA" },
  { id: "5", name: "كمال رحماني", trade: "نجار محترف", category: "carpentry", price: "من 2,500 دج", distance: "4.2 كم", rating: "4.6", initials: "كر", color: "#B45309" },
  { id: "6", name: "فاطمة زروال", trade: "تنسيق حدائق", category: "garden", price: "من 2,200 دج", distance: "3.7 كم", rating: "4.8", initials: "فز", color: "#15803D" },
];

export default function CategoriesScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const initial = catalog.some((item) => item.id === params.category) ? params.category! : "all";
  const [selected, setSelected] = useState(initial);
  const [query, setQuery] = useState("");
  const selectedCategory = catalog.find((item) => item.id === selected);
  const visibleCategories = useMemo(() => catalog.filter((item) => item.label.includes(query.trim()) || item.sub.some((sub) => sub.includes(query.trim()))), [query]);
  const visibleProviders = useMemo(() => providers.filter((item) => selected === "all" || item.category === selected), [selected]);

  return <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.header}><Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="arrow.left" size={20} color={colors.foreground} /></Pressable><View><Text style={[styles.title, { color: colors.foreground }]}>كل الخدمات</Text><Text style={[styles.subtitle, { color: colors.muted }]}>اختر الخدمة التي تحتاجها</Text></View></View>
      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="magnifyingglass" size={20} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="ابحث عن خدمة أو تصنيف فرعي..." placeholderTextColor={colors.muted} style={[styles.searchInput, { color: colors.foreground }]} textAlign="right" /></View>
      <FlatList horizontal inverted data={[{ id: "all", label: "الكل", icon: "wrench.and.screwdriver.fill" }, ...catalog]} keyExtractor={(item) => item.id} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} renderItem={({ item }) => <Pressable onPress={() => setSelected(item.id)} style={[styles.chip, { backgroundColor: selected === item.id ? colors.primary : colors.surface, borderColor: selected === item.id ? colors.primary : colors.border }]}><IconSymbol name={item.icon as any} size={16} color={selected === item.id ? "#FFFFFF" : colors.primary} /><Text style={{ color: selected === item.id ? "#FFFFFF" : colors.foreground, fontSize: 12, fontWeight: "700" }}>{item.label}</Text></Pressable>} />
      {selectedCategory && <View style={[styles.subcategoryCard, { backgroundColor: "#E7F5F2" }]}><View style={styles.subHeader}><Text style={[styles.subTitle, { color: colors.foreground }]}>خدمات {selectedCategory.label}</Text><IconSymbol name={selectedCategory.icon as any} size={23} color={colors.primary} /></View><View style={styles.subGrid}>{selectedCategory.sub.map((item) => <Pressable key={item} onPress={() => Alert.alert(item, `سنبحث لك عن أفضل مقدمي خدمة ${item}.`)} style={[styles.subItem, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.subItemText, { color: colors.foreground }]}>{item}</Text><Text style={[styles.arrow, { color: colors.primary }]}>←</Text></Pressable>)}</View></View>}
      {!selectedCategory && <View><Text style={[styles.sectionTitle, { color: colors.foreground }]}>استكشف التصنيفات</Text><View style={styles.catalogGrid}>{visibleCategories.map((item) => <Pressable key={item.id} onPress={() => setSelected(item.id)} style={[styles.catalogCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.catalogIcon, { backgroundColor: `${colors.primary}14` }]}><IconSymbol name={item.icon as any} size={22} color={colors.primary} /></View><Text style={[styles.catalogLabel, { color: colors.foreground }]}>{item.label}</Text><Text style={[styles.catalogCount, { color: colors.muted }]}>{item.sub.length} خدمات فرعية</Text></Pressable>)}</View></View>}
      <View style={styles.providerHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>{selectedCategory ? `حرفيون في ${selectedCategory.label}` : "حرفيون موصى بهم"}</Text><Text style={[styles.providerCount, { color: colors.primary }]}>{visibleProviders.length} نتائج</Text></View>
      <FlatList data={visibleProviders} scrollEnabled={false} keyExtractor={(item) => item.id} contentContainerStyle={styles.providers} renderItem={({ item }) => <Pressable onPress={() => router.push({ pathname: "/provider/[id]", params: { id: item.id } })} style={[styles.providerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.providerTop}><View style={[styles.avatar, { backgroundColor: item.color }]}><Text style={styles.avatarText}>{item.initials}</Text></View><View style={styles.providerCopy}><Text style={[styles.providerName, { color: colors.foreground }]}>{item.name}</Text><Text style={[styles.providerTrade, { color: colors.muted }]}>{item.trade}</Text></View><View style={styles.verified}><Text style={styles.verifiedText}>✓</Text></View></View><View style={styles.providerMeta}><Text style={[styles.meta, { color: colors.muted }]}>{item.distance}</Text><Text style={[styles.meta, { color: colors.muted }]}>{item.price}</Text><Text style={[styles.rating, { color: colors.foreground }]}>★ {item.rating}</Text></View><View style={[styles.viewProfile, { backgroundColor: colors.background }]}><Text style={[styles.viewProfileText, { color: colors.primary }]}>عرض الملف وطلب الخدمة ←</Text></View></Pressable>} />
      {query && visibleCategories.length === 0 && <Text style={[styles.empty, { color: colors.muted }]}>لم نعثر على تصنيف مطابق.</Text>}
    </ScrollView>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 10, paddingBottom: 35, gap: 18 },
  header: { flexDirection: "row-reverse", alignItems: "center", gap: 13 },
  title: { fontSize: 27, fontWeight: "800", textAlign: "right" },
  subtitle: { fontSize: 13, textAlign: "right", marginTop: 4 },
  back: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  search: { height: 52, borderWidth: 1, borderRadius: 16, flexDirection: "row-reverse", alignItems: "center", paddingHorizontal: 14, gap: 9 },
  searchInput: { flex: 1, fontSize: 13 },
  chips: { gap: 8, paddingVertical: 1 },
  chip: { height: 38, borderWidth: 1, paddingHorizontal: 12, borderRadius: 12, flexDirection: "row-reverse", alignItems: "center", gap: 6 },
  subcategoryCard: { borderRadius: 20, padding: 15, gap: 13 },
  subHeader: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  subTitle: { fontSize: 17, fontWeight: "800", textAlign: "right" },
  subGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  subItem: { minWidth: "47%", flex: 1, minHeight: 43, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  subItemText: { fontSize: 12, fontWeight: "700", textAlign: "right" },
  arrow: { fontSize: 16, fontWeight: "800" },
  sectionTitle: { fontSize: 19, fontWeight: "800", textAlign: "right" },
  catalogGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 10, marginTop: 12 },
  catalogCard: { width: "31.5%", minHeight: 105, borderRadius: 16, borderWidth: 1, padding: 10, alignItems: "center", justifyContent: "center", gap: 6 },
  catalogIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  catalogLabel: { fontSize: 11, fontWeight: "800", textAlign: "center" },
  catalogCount: { fontSize: 9, textAlign: "center" },
  providerHeader: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  providerCount: { fontSize: 12, fontWeight: "800" },
  providers: { gap: 11 },
  providerCard: { borderWidth: 1, borderRadius: 19, padding: 15, gap: 13 },
  providerTop: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  avatar: { width: 47, height: 47, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  providerCopy: { flex: 1 },
  providerName: { fontSize: 15, fontWeight: "800", textAlign: "right" },
  providerTrade: { fontSize: 12, textAlign: "right", marginTop: 4 },
  verified: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#D9F3ED", alignItems: "center", justifyContent: "center" },
  verifiedText: { color: "#0F766E", fontWeight: "900", fontSize: 12 },
  providerMeta: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  meta: { fontSize: 11 },
  rating: { fontSize: 12, fontWeight: "800" },
  viewProfile: { borderRadius: 10, height: 35, alignItems: "center", justifyContent: "center" },
  viewProfileText: { fontSize: 12, fontWeight: "800" },
  empty: { textAlign: "center", paddingVertical: 30 },
});
