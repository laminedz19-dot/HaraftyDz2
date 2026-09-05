import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type Category = { id: string; label: string; icon: string };
type Pro = { id: string; name: string; trade: string; rating: string; jobs: string; initials: string; color: string; verified: boolean };

const categories: Category[] = [
  { id: "plumbing", label: "سباكة", icon: "drop.fill" },
  { id: "electric", label: "كهرباء", icon: "bolt.fill" },
  { id: "maintenance", label: "صيانة", icon: "wrench.and.screwdriver.fill" },
  { id: "painting", label: "دهان", icon: "paintbrush.fill" },
  { id: "ac", label: "تكييف", icon: "snowflake" },
  { id: "cleaning", label: "تنظيف", icon: "sparkles" },
  { id: "carpentry", label: "نجارة", icon: "hammer.fill" },
  { id: "garden", label: "حدائق", icon: "leaf.fill" },
  { id: "moving", label: "نقل أثاث", icon: "truck.box.fill" },
  { id: "renovation", label: "ترميم", icon: "house.fill" },
  { id: "pest", label: "مكافحة حشرات", icon: "bug.fill" },
  { id: "glass", label: "زجاج وألمنيوم", icon: "window.horizontal" },
  { id: "furniture", label: "أثاث ومفروشات", icon: "sofa.fill" },
  { id: "appliances", label: "أجهزة منزلية", icon: "washer.fill" },
  { id: "tv", label: "تلفاز ورسيفر", icon: "tv.fill" },
  { id: "internet", label: "إنترنت وشبكات", icon: "wifi" },
  { id: "security", label: "أمن وكاميرات", icon: "video.fill" },
  { id: "solar", label: "طاقة شمسية", icon: "sun.max.fill" },
  { id: "insulation", label: "عزل الأسطح", icon: "square.stack.3d.up.fill" },
  { id: "gypsum", label: "جبس وديكور", icon: "text.alignleft" },
  { id: "kitchens", label: "مطابخ وخزائن", icon: "cabinet.fill" },
  { id: "locks", label: "أقفال ومفاتيح", icon: "lock.fill" },
  { id: "car", label: "غسيل سيارات", icon: "car.fill" },
  { id: "sewing", label: "خياطة وستائر", icon: "scissors" },
  { id: "events", label: "تنظيم مناسبات", icon: "person.2.fill" },
  { id: "photography", label: "تصوير", icon: "camera.fill" },
];

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [location, setLocation] = useState("الجزائر العاصمة");
  const providersQuery = trpc.providers.list.useQuery(undefined);
  const pros: Pro[] = (providersQuery.data ?? []).map((provider, index) => ({
    id: String(provider.id),
    name: provider.name,
    trade: provider.trade,
    rating: provider.rating ?? "0",
    jobs: `${provider.completedJobs} خدمة`,
    initials: provider.name.split(" ").slice(0, 2).map((part) => part[0]).join(""),
    color: ["#0F766E", "#D97706", "#1D4ED8", "#7C3AED"][index % 4],
    verified: provider.verified,
  }));

  const filteredPros = useMemo(() => {
    if (!query.trim()) return pros;
    return pros.filter((pro) => `${pro.name} ${pro.trade}`.includes(query.trim()));
  }, [query]);

  const showComingSoon = (message: string) => Alert.alert("خدمني", message);

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.muted }]}>أهلاً بك في</Text>
            <Text style={[styles.brand, { color: colors.foreground }]}>خدمني.</Text>
          </View>
          <Pressable onPress={() => router.push("/notifications")} style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
            <IconSymbol name="bell.fill" size={22} color={colors.foreground} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        <View style={[styles.locationPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="location.fill" size={18} color={colors.primary} />
          <Text style={[styles.locationLabel, { color: colors.muted }]}>موقعك الحالي</Text>
          <Pressable onPress={() => setLocation(location === "الجزائر العاصمة" ? "وهران" : "الجزائر العاصمة")}>
            <Text style={[styles.locationValue, { color: colors.foreground }]}>{location}</Text>
          </Pressable>
          <IconSymbol name="chevron.right" size={16} color={colors.muted} />
        </View>

        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <View style={styles.heroDecorOne} />
          <View style={styles.heroDecorTwo} />
          <Text style={styles.heroKicker}>خدمة موثوقة، في وقتك</Text>
          <Text style={styles.heroTitle}>منزلك يستاهل{`\n`}الأفضل.</Text>
          <Text style={styles.heroBody}>اكتشف حرفيين موثوقين بالقرب منك وأنجز أشغالك براحة بال.</Text>
          <Pressable onPress={() => showComingSoon("أرسل تفاصيل طلبك وسنقترح عليك أفضل الحرفيين القريبين منك.")} style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}>
            <Text style={[styles.heroButtonText, { color: colors.primary }]}>اطلب خدمة الآن</Text>
            <IconSymbol name="chevron.right" size={18} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>ماذا تحتاج اليوم؟</Text>
          <Pressable onPress={() => router.push("/categories")}><Text style={[styles.seeAll, { color: colors.primary }]}>عرض الكل</Text></Pressable>
        </View>
        <FlatList
          horizontal
          inverted
          showsHorizontalScrollIndicator={false}
          data={[{ id: "all", label: "الكل", icon: "wrench.and.screwdriver.fill" as const }, ...categories]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => {
            const active = selectedCategory === item.id;
            return (
              <Pressable onPress={() => setSelectedCategory(item.id)} style={({ pressed }) => [styles.categoryItem, pressed && styles.pressed]}>
                <View style={[styles.categoryIcon, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}>
                  <IconSymbol name={item.icon as any} size={24} color={active ? "#FFFFFF" : colors.primary} />
                </View>
                <Text style={[styles.categoryLabel, { color: active ? colors.primary : colors.muted }]}>{item.label}</Text>
              </Pressable>
            );
          }}
        />

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>حرفيون بالقرب منك</Text>
          <Pressable onPress={() => showComingSoon("يمكنك تصفية النتائج حسب التقييم، السعر، والمسافة.")}><Text style={[styles.seeAll, { color: colors.primary }]}>استكشف</Text></Pressable>
        </View>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={21} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="ابحث عن خدمة أو حرفي..."
            placeholderTextColor={colors.muted}
            style={[styles.searchInput, { color: colors.foreground }]}
            textAlign="right"
          />
        </View>

        <FlatList
          horizontal
          inverted
          showsHorizontalScrollIndicator={false}
          data={filteredPros}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.proList}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push({ pathname: "/provider/[id]", params: { id: item.id } })} style={({ pressed }) => [styles.proCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
              <View style={styles.proHeader}>
                <View style={[styles.avatar, { backgroundColor: item.color }]}><Text style={styles.avatarText}>{item.initials}</Text></View>
                <View style={styles.proNameBlock}>
                  <Text style={[styles.proName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.proTrade, { color: colors.muted }]}>{item.trade}</Text>
                </View>
                {item.verified && <View style={styles.verified}><Text style={styles.verifiedText}>✓</Text></View>}
              </View>
              <View style={styles.proMeta}>
                <Text style={[styles.jobs, { color: colors.muted }]}>{item.jobs}</Text>
                <View style={styles.rating}><Text style={styles.star}>★</Text><Text style={[styles.ratingText, { color: colors.foreground }]}>{item.rating}</Text></View>
              </View>
              <View style={[styles.profileAction, { backgroundColor: colors.background }]}><Text style={[styles.profileActionText, { color: colors.primary }]}>عرض الملف</Text><IconSymbol name="chevron.right" size={15} color={colors.primary} /></View>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.muted }]}>لم نعثر على نتائج مطابقة.</Text>}
        />

        <View style={[styles.trustCard, { backgroundColor: "#E7F5F2" }]}>
          <View style={[styles.trustIcon, { backgroundColor: colors.primary }]}><Text style={styles.trustIconText}>✓</Text></View>
          <View style={styles.trustCopy}>
            <Text style={[styles.trustTitle, { color: colors.foreground }]}>اختيار آمن ومطمئن</Text>
            <Text style={[styles.trustBody, { color: colors.muted }]}>نراجع ملفات الحرفيين ونترك لك تقييم تجربتك بعد كل خدمة.</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 28, gap: 20 },
  topBar: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  eyebrow: { fontSize: 13, textAlign: "right", marginBottom: 2 },
  brand: { fontSize: 29, fontWeight: "800", textAlign: "right", letterSpacing: -0.7 },
  iconButton: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center", position: "relative" },
  notificationDot: { position: "absolute", top: 9, right: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: "#E26D5C", borderWidth: 1.5, borderColor: "#FFFFFF" },
  locationPill: { minHeight: 42, borderWidth: 1, borderRadius: 14, flexDirection: "row-reverse", alignItems: "center", paddingHorizontal: 13, gap: 7 },
  locationLabel: { fontSize: 12, marginRight: 1 },
  locationValue: { fontSize: 13, fontWeight: "700", marginLeft: 2 },
  hero: { minHeight: 248, borderRadius: 24, padding: 23, overflow: "hidden", position: "relative" },
  heroDecorOne: { position: "absolute", width: 170, height: 170, borderRadius: 90, right: -62, top: -74, backgroundColor: "rgba(255,255,255,0.10)" },
  heroDecorTwo: { position: "absolute", width: 220, height: 220, borderRadius: 110, left: -150, bottom: -150, backgroundColor: "rgba(0,0,0,0.08)" },
  heroKicker: { color: "#B9F3E8", fontSize: 13, fontWeight: "700", textAlign: "right", marginBottom: 10 },
  heroTitle: { color: "#FFFFFF", fontSize: 32, lineHeight: 38, fontWeight: "800", textAlign: "right", letterSpacing: -0.8 },
  heroBody: { color: "#D8F7F1", fontSize: 13, lineHeight: 21, width: "76%", alignSelf: "flex-end", textAlign: "right", marginTop: 9 },
  heroButton: { alignSelf: "flex-end", marginTop: 17, paddingVertical: 12, paddingHorizontal: 15, borderRadius: 13, backgroundColor: "#FFFFFF", flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  heroButtonText: { fontSize: 13, fontWeight: "800" },
  sectionHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  sectionTitle: { fontSize: 19, fontWeight: "800", textAlign: "right" },
  seeAll: { fontSize: 13, fontWeight: "700" },
  categoryList: { gap: 14, paddingVertical: 1 },
  categoryItem: { alignItems: "center", width: 70, gap: 7 },
  categoryIcon: { width: 58, height: 58, borderRadius: 19, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  categoryLabel: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  searchBox: { height: 52, borderWidth: 1, borderRadius: 16, flexDirection: "row-reverse", alignItems: "center", paddingHorizontal: 15, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  proList: { gap: 12 },
  proCard: { width: 278, borderWidth: 1, borderRadius: 20, padding: 16, gap: 15 },
  proHeader: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  avatar: { width: 49, height: 49, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  proNameBlock: { flex: 1 },
  proName: { fontSize: 15, fontWeight: "800", textAlign: "right" },
  proTrade: { fontSize: 12, textAlign: "right", marginTop: 4 },
  verified: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#D9F3ED", alignItems: "center", justifyContent: "center" },
  verifiedText: { color: "#0F766E", fontWeight: "900", fontSize: 12 },
  proMeta: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  rating: { flexDirection: "row", alignItems: "center", gap: 4 },
  star: { color: "#E6A23C", fontSize: 16 },
  ratingText: { fontSize: 13, fontWeight: "800" },
  jobs: { fontSize: 12 },
  profileAction: { height: 34, borderRadius: 10, flexDirection: "row-reverse", justifyContent: "center", alignItems: "center", gap: 5 },
  profileActionText: { fontSize: 12, fontWeight: "800" },
  trustCard: { borderRadius: 19, padding: 15, flexDirection: "row-reverse", alignItems: "center", gap: 12 },
  trustIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  trustIconText: { color: "#FFFFFF", fontSize: 19, fontWeight: "900" },
  trustCopy: { flex: 1 },
  trustTitle: { fontSize: 14, fontWeight: "800", textAlign: "right", marginBottom: 4 },
  trustBody: { fontSize: 12, lineHeight: 18, textAlign: "right" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  empty: { textAlign: "right", paddingVertical: 20 },
});
