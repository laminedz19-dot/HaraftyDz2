import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const data: Record<string, { name: string; trade: string; category: string; rating: string; jobs: string; distance: string; price: string; initials: string; color: string; city: string; bio: string; skills: string[]; reviews: { name: string; text: string; rating: string }[] }> = {
  "1": { name: "ياسين بوعلام", trade: "كهربائي معتمد", category: "electric", rating: "4.9", jobs: "126", distance: "1.2 كم", price: "من 1,500 دج", initials: "يب", color: "#0F766E", city: "الجزائر العاصمة", bio: "أساعد العائلات وأصحاب الأعمال على حل مشاكل الكهرباء بسرعة وأمان، من الأعطال البسيطة إلى تمديدات المنازل الجديدة.", skills: ["إصلاح الأعطال", "تمديد الكهرباء", "تركيب الإنارة", "لوحات التوزيع"], reviews: [{ name: "أحمد ق.", text: "وصل في الموعد وأنهى العمل باحتراف.", rating: "5.0" }, { name: "سارة م.", text: "شرح المشكلة بوضوح وسعره مناسب.", rating: "4.8" }] },
  "2": { name: "سميرة قادري", trade: "سباكة وصيانة", category: "plumbing", rating: "4.8", jobs: "98", distance: "2.4 كم", price: "من 1,200 دج", initials: "سق", color: "#D97706", city: "الجزائر العاصمة", bio: "متخصصة في أعمال السباكة المنزلية وإصلاح التسربات وتركيب الأدوات الصحية مع خدمة سريعة ونظيفة.", skills: ["إصلاح التسربات", "تسليك المجاري", "تركيب الصنابير", "السخانات"], reviews: [{ name: "ليلى ب.", text: "خدمة ممتازة ونظافة بعد انتهاء العمل.", rating: "5.0" }, { name: "مراد س.", text: "تجربة موفقة وأنصح بها.", rating: "4.7" }] },
  "3": { name: "مراد حسان", trade: "تركيب مكيفات", category: "ac", rating: "4.7", jobs: "74", distance: "3.1 كم", price: "من 3,000 دج", initials: "مح", color: "#1D4ED8", city: "الجزائر العاصمة", bio: "تركيب وصيانة وتنظيف المكيفات المنزلية والمكتبية مع ضمان على جودة التركيب.", skills: ["تركيب مكيف", "تنظيف داخلي", "تعبئة الفريون", "صيانة دورية"], reviews: [{ name: "يوسف ع.", text: "تركيب مرتب وسريع.", rating: "4.8" }, { name: "ريم ن.", text: "التزم بالموعد وقدم نصائح مفيدة.", rating: "4.6" }] },
};

export default function ProviderDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const provider = data[id ?? "1"] ?? data["1"];
  return <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.header}><Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="arrow.left" size={20} color={colors.foreground} /></Pressable><Text style={[styles.headerTitle, { color: colors.foreground }]}>ملف الحرفي</Text><Pressable onPress={() => Alert.alert("مشاركة", "يمكنك مشاركة ملف الحرفي مع عائلتك وأصدقائك.")}><Text style={[styles.share, { color: colors.primary }]}>مشاركة</Text></Pressable></View>
      <View style={[styles.profileHero, { backgroundColor: colors.primary }]}><View style={[styles.bigAvatar, { backgroundColor: provider.color }]}><Text style={styles.bigInitials}>{provider.initials}</Text></View><Text style={styles.name}>{provider.name}</Text><Text style={styles.trade}>{provider.trade}</Text><View style={styles.verifiedLine}><View style={styles.whiteCheck}><Text style={styles.checkText}>✓</Text></View><Text style={styles.verifiedLabel}>حساب موثّق</Text></View></View>
      <View style={styles.stats}><View style={styles.stat}><Text style={[styles.statValue, { color: colors.foreground }]}>{provider.rating}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>التقييم</Text></View><View style={[styles.divider, { backgroundColor: colors.border }]} /><View style={styles.stat}><Text style={[styles.statValue, { color: colors.foreground }]}>{provider.jobs}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>خدمة مكتملة</Text></View><View style={[styles.divider, { backgroundColor: colors.border }]} /><View style={styles.stat}><Text style={[styles.statValue, { color: colors.foreground }]}>{provider.distance}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>عن موقعك</Text></View></View>
      <Pressable onPress={() => router.push({ pathname: "/request", params: { providerId: id ?? "1", category: provider.category } })} style={({ pressed }) => [styles.book, { backgroundColor: colors.primary }, pressed && { opacity: 0.82 }]}><Text style={styles.bookText}>اطلب هذه الخدمة</Text><IconSymbol name="chevron.right" size={19} color="#FFFFFF" /></Pressable>
      <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>نبذة عن الحرفي</Text><Text style={[styles.bio, { color: colors.muted }]}>{provider.bio}</Text><View style={styles.location}><IconSymbol name="location.fill" size={17} color={colors.primary} /><Text style={[styles.locationText, { color: colors.muted }]}>{provider.city} · {provider.price}</Text></View></View>
      <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>الخدمات التي يقدمها</Text><View style={styles.skills}>{provider.skills.map((skill) => <View key={skill} style={[styles.skill, { backgroundColor: `${colors.primary}14` }]}><Text style={[styles.skillText, { color: colors.primary }]}>{skill}</Text></View>)}</View></View>
      <View style={styles.section}><View style={styles.reviewHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>آراء العملاء</Text><Text style={[styles.seeAll, { color: colors.primary }]}>عرض الكل</Text></View>{provider.reviews.map((review) => <View key={review.name} style={[styles.review, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.reviewTop}><Text style={[styles.reviewRating, { color: colors.foreground }]}>★ {review.rating}</Text><Text style={[styles.reviewer, { color: colors.foreground }]}>{review.name}</Text></View><Text style={[styles.reviewText, { color: colors.muted }]}>{review.text}</Text></View>)}</View>
    </ScrollView>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 9, paddingBottom: 35, gap: 18 },
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  back: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  share: { fontSize: 12, fontWeight: "800" },
  profileHero: { borderRadius: 23, alignItems: "center", paddingVertical: 23 },
  bigAvatar: { width: 76, height: 76, borderRadius: 25, alignItems: "center", justifyContent: "center", marginBottom: 11 },
  bigInitials: { color: "#FFFFFF", fontSize: 24, fontWeight: "900" },
  name: { color: "#FFFFFF", fontSize: 21, fontWeight: "800" },
  trade: { color: "#D8F7F1", fontSize: 13, marginTop: 5 },
  verifiedLine: { flexDirection: "row-reverse", alignItems: "center", gap: 6, marginTop: 11 },
  whiteCheck: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  checkText: { color: "#0F766E", fontWeight: "900", fontSize: 11 },
  verifiedLabel: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  stats: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-around", paddingVertical: 5 },
  stat: { alignItems: "center", gap: 5 },
  statValue: { fontSize: 16, fontWeight: "800" },
  statLabel: { fontSize: 11 },
  divider: { width: 1, height: 28 },
  book: { height: 52, borderRadius: 15, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 9 },
  bookText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  section: { gap: 11 },
  sectionTitle: { fontSize: 18, fontWeight: "800", textAlign: "right" },
  bio: { fontSize: 13, lineHeight: 21, textAlign: "right" },
  location: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "flex-start", gap: 6 },
  locationText: { fontSize: 12 },
  skills: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  skill: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10 },
  skillText: { fontSize: 11, fontWeight: "700" },
  reviewHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  seeAll: { fontSize: 12, fontWeight: "700" },
  review: { borderWidth: 1, borderRadius: 15, padding: 12, gap: 7 },
  reviewTop: { flexDirection: "row-reverse", justifyContent: "space-between" },
  reviewRating: { fontSize: 12, fontWeight: "800" },
  reviewer: { fontSize: 12, fontWeight: "800" },
  reviewText: { fontSize: 12, textAlign: "right" },
});
