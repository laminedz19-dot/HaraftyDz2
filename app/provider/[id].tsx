import { Alert, Image, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ExpoLinking from "expo-linking";
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { startOAuthLogin } from "@/constants/oauth";

const data: Record<string, { name: string; trade: string; category: string; rating: string; jobs: string; distance: string; price: string; initials: string; color: string; city: string; bio: string; skills: string[]; reviews: { name: string; text: string; rating: string }[] }> = {
  "1": { name: "ياسين بوعلام", trade: "كهربائي معتمد", category: "electric", rating: "4.9", jobs: "126", distance: "1.2 كم", price: "من 1,500 دج", initials: "يب", color: "#0F766E", city: "الجزائر العاصمة", bio: "أساعد العائلات وأصحاب الأعمال على حل مشاكل الكهرباء بسرعة وأمان، من الأعطال البسيطة إلى تمديدات المنازل الجديدة.", skills: ["إصلاح الأعطال", "تمديد الكهرباء", "تركيب الإنارة", "لوحات التوزيع"], reviews: [{ name: "أحمد ق.", text: "وصل في الموعد وأنهى العمل باحتراف.", rating: "5.0" }, { name: "سارة م.", text: "شرح المشكلة بوضوح وسعره مناسب.", rating: "4.8" }] },
  "2": { name: "سميرة قادري", trade: "سباكة وصيانة", category: "plumbing", rating: "4.8", jobs: "98", distance: "2.4 كم", price: "من 1,200 دج", initials: "سق", color: "#D97706", city: "الجزائر العاصمة", bio: "متخصصة في أعمال السباكة المنزلية وإصلاح التسربات وتركيب الأدوات الصحية مع خدمة سريعة ونظيفة.", skills: ["إصلاح التسربات", "تسليك المجاري", "تركيب الصنابير", "السخانات"], reviews: [{ name: "ليلى ب.", text: "خدمة ممتازة ونظافة بعد انتهاء العمل.", rating: "5.0" }, { name: "مراد س.", text: "تجربة موفقة وأنصح بها.", rating: "4.7" }] },
  "3": { name: "مراد حسان", trade: "تركيب مكيفات", category: "ac", rating: "4.7", jobs: "74", distance: "3.1 كم", price: "من 3,000 دج", initials: "مح", color: "#1D4ED8", city: "الجزائر العاصمة", bio: "تركيب وصيانة وتنظيف المكيفات المنزلية والمكتبية مع ضمان على جودة التركيب.", skills: ["تركيب مكيف", "تنظيف داخلي", "تعبئة الفريون", "صيانة دورية"], reviews: [{ name: "يوسف ع.", text: "تركيب مرتب وسريع.", rating: "4.8" }, { name: "ريم ن.", text: "التزم بالموعد وقدم نصائح مفيدة.", rating: "4.6" }] },
  "4": { name: "نادية مرزوق", trade: "تنظيف وتعقيم", category: "cleaning", rating: "4.9", jobs: "112", distance: "1.8 كم", price: "من 2,000 دج", initials: "نم", color: "#9333EA", city: "الجزائر العاصمة", bio: "خدمات تنظيف وتعقيم للمنازل والمكاتب مع عناية بالتفاصيل والالتزام بالمواعيد.", skills: ["تنظيف عميق", "تعقيم المنازل", "تنظيف المكاتب", "تنظيف بعد البناء"], reviews: [{ name: "أمينة ر.", text: "خدمة منظمة ونتيجة ممتازة.", rating: "5.0" }] },
  "5": { name: "كمال رحماني", trade: "نجار محترف", category: "carpentry", rating: "4.6", jobs: "86", distance: "4.2 كم", price: "من 2,500 دج", initials: "كر", color: "#B45309", city: "الجزائر العاصمة", bio: "أعمال النجارة وإصلاح الأثاث والأبواب والخزائن بقياسات دقيقة وتشطيب متقن.", skills: ["إصلاح الأثاث", "أبواب وخزائن", "تفصيل خشب", "تركيب باركيه"], reviews: [{ name: "كريم ب.", text: "عمل متقن والتزام بالاتفاق.", rating: "4.7" }] },
  "6": { name: "فاطمة زروال", trade: "تنسيق حدائق", category: "garden", rating: "4.8", jobs: "69", distance: "3.7 كم", price: "من 2,200 دج", initials: "فز", color: "#15803D", city: "الجزائر العاصمة", bio: "تنسيق الحدائق المنزلية والعناية بالنباتات وشبكات الري بخطة تناسب مساحة منزلك.", skills: ["تنسيق حدائق", "قص الأشجار", "شبكات الري", "زراعة منزلية"], reviews: [{ name: "سليم ع.", text: "تحسن شكل الحديقة كثيراً.", rating: "4.8" }] },
};

export default function ProviderDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const provider = data[id ?? "1"] ?? data["1"];
  const { isAuthenticated } = useAuth();
  const providerQuery = trpc.providers.get.useQuery({ id: Number(id ?? 1) });
  const portfolioQuery = trpc.portfolio.list.useQuery({ providerId: Number(id ?? 1) });
  const uploadMutation = trpc.portfolio.upload.useMutation({ onSuccess: () => portfolioQuery.refetch() });
  const reportMutation = trpc.providers.report.useMutation({ onSuccess: () => Alert.alert("تم استلام البلاغ", "شكراً لمساعدتنا على الحفاظ على ملفات حرفيين موثوقة.") });
  const pickPortfolioImage = async () => {
    if (!isAuthenticated) {
      Alert.alert("خاص بالحرفي", "إضافة الأعمال السابقة متاحة للحرفيين بعد تسجيل الدخول إلى حسابهم.", [{ text: "حسناً", style: "cancel" }]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.82, base64: true });
    if (result.canceled || !result.assets[0]?.base64) return;
    try {
      await uploadMutation.mutateAsync({ base64: result.assets[0].base64, mimeType: result.assets[0].mimeType ?? "image/jpeg", caption: "عمل سابق" });
      Alert.alert("تم رفع الصورة", "أضيفت الصورة إلى معرض أعمالك.");
    } catch {
      Alert.alert("تعذر رفع الصورة", "تأكد من إنشاء ملف الحرفي ثم حاول مرة أخرى.");
    }
  };
  const portfolio = portfolioQuery.data ?? [];
  const deleteMutation = trpc.portfolio.delete.useMutation({ onSuccess: () => portfolioQuery.refetch() });
  const confirmDelete = (imageId: number) => Alert.alert("حذف الصورة", "هل تريد حذف هذه الصورة من معرض أعمالك؟", [{ text: "إلغاء", style: "cancel" }, { text: "حذف", style: "destructive", onPress: () => deleteMutation.mutate({ id: imageId }) }]);
  const openWhatsApp = async () => {
    const rawPhone = providerQuery.data?.phone?.trim();
    if (!rawPhone) {
      Alert.alert("رقم واتساب غير متوفر", "لم يضف الحرفي رقم هاتف للتواصل عبر واتساب بعد.");
      return;
    }
    const digits = rawPhone.replace(/[^\d+]/g, "");
    const normalized = digits.startsWith("+213") ? digits.slice(1) : digits.startsWith("00213") ? digits.slice(2) : digits.startsWith("0") ? `213${digits.slice(1)}` : digits;
    const url = `https://wa.me/${normalized}?text=${encodeURIComponent(`السلام عليكم، أريد الاستفسار عن خدماتك عبر خدمني.`)}`;
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
    else Alert.alert("تعذر فتح واتساب", "تأكد من تثبيت تطبيق واتساب على جهازك.");
  };
  const callProvider = async () => {
    const rawPhone = providerQuery.data?.phone?.trim();
    if (!rawPhone) {
      Alert.alert("رقم الهاتف غير متوفر", "لم يضف الحرفي رقم هاتف للتواصل بعد.");
      return;
    }
    const digits = rawPhone.replace(/[^\d+]/g, "");
    const normalized = digits.startsWith("+213") ? digits.slice(1) : digits.startsWith("00213") ? digits.slice(2) : digits.startsWith("0") ? `213${digits.slice(1)}` : digits;
    const url = `tel:+${normalized}`;
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
    else Alert.alert("تعذر بدء الاتصال", "لا يمكن فتح تطبيق الاتصال على هذا الجهاز.");
  };
  const shareProfile = async () => {
    const profileUrl = ExpoLinking.createURL(`/provider/${id ?? "1"}`);
    const result = await Share.share({
      title: `بروفايل ${provider.name}`,
      message: `اكتشف بروفايل ${provider.name}، ${provider.trade}، عبر تطبيق خدمني.\n${profileUrl}`,
      url: profileUrl,
    });
    if (result.action === Share.sharedAction) return;
  };
  const reportProfile = () => {
    const reasons = [
      { label: "بروفايل وهمي أو منتحل", value: "fake" as const },
      { label: "الحرفي غير فعال أو لا يرد", value: "inactive" as const },
      { label: "معلومات خاطئة", value: "wrong_info" as const },
      { label: "محتوى غير لائق", value: "inappropriate" as const },
      { label: "سبب آخر", value: "other" as const },
    ];
    Alert.alert("إبلاغ عن البروفايل", "ما سبب الإبلاغ عن هذا الحرفي؟", [
      ...reasons.map((reason) => ({ text: reason.label, onPress: () => reportMutation.mutate({ providerId: Number(id ?? 1), reason: reason.value }) })),
      { text: "إلغاء", style: "cancel" },
    ]);
  };
  return <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.header}><Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="arrow.left" size={20} color={colors.foreground} /></Pressable><Text style={[styles.headerTitle, { color: colors.foreground }]}>ملف الحرفي</Text><Pressable onPress={shareProfile} style={[styles.shareButton, { backgroundColor: `${colors.primary}12` }]}><IconSymbol name="square.and.arrow.up" size={16} color={colors.primary} /><Text style={[styles.share, { color: colors.primary }]}>مشاركة</Text></Pressable></View>
      <View style={[styles.profileHero, { backgroundColor: colors.primary }]}><View style={[styles.bigAvatar, { backgroundColor: provider.color }]}><Text style={styles.bigInitials}>{provider.initials}</Text></View><Text style={styles.name}>{provider.name}</Text><Text style={styles.trade}>{provider.trade}</Text><View style={styles.verifiedLine}><View style={styles.whiteCheck}><Text style={styles.checkText}>✓</Text></View><Text style={styles.verifiedLabel}>حساب موثّق</Text></View></View>
      <View style={styles.stats}><View style={styles.stat}><Text style={[styles.statValue, { color: colors.foreground }]}>{provider.rating}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>التقييم</Text></View><View style={[styles.divider, { backgroundColor: colors.border }]} /><View style={styles.stat}><Text style={[styles.statValue, { color: colors.foreground }]}>{provider.jobs}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>خدمة مكتملة</Text></View><View style={[styles.divider, { backgroundColor: colors.border }]} /><View style={styles.stat}><Text style={[styles.statValue, { color: colors.foreground }]}>{provider.distance}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>عن موقعك</Text></View></View>
      <View style={styles.actionRow}><Pressable onPress={() => router.push({ pathname: "/request", params: { providerId: id ?? "1", category: provider.category } })} style={({ pressed }) => [styles.book, { backgroundColor: colors.primary, flex: 1 }, pressed && { opacity: 0.82 }]}><Text style={styles.bookText}>اطلب هذه الخدمة</Text><IconSymbol name="chevron.right" size={19} color="#FFFFFF" /></Pressable><Pressable onPress={openWhatsApp} style={({ pressed }) => [styles.whatsappButton, pressed && { opacity: 0.75 }]}><Text style={styles.whatsappText}>واتساب</Text><Text style={styles.whatsappIcon}>◉</Text></Pressable><Pressable onPress={callProvider} style={({ pressed }) => [styles.callButton, pressed && { opacity: 0.75 }]}><IconSymbol name="phone.fill" size={18} color="#FFFFFF" /><Text style={styles.callText}>اتصال</Text></Pressable><Pressable onPress={() => router.push({ pathname: "/chat/[conversationId]", params: { conversationId: `provider-${id ?? "1"}`, providerId: id ?? "1", name: provider.name } })} style={({ pressed }) => [styles.chatButton, { backgroundColor: colors.surface, borderColor: colors.primary }, pressed && { opacity: 0.75 }]}><IconSymbol name="message.fill" size={19} color={colors.primary} /></Pressable></View>
      <Pressable onPress={reportProfile} disabled={reportMutation.isPending} style={({ pressed }) => [styles.reportButton, { borderColor: colors.border }, pressed && { opacity: 0.75 }]}><IconSymbol name="exclamationmark.triangle.fill" size={15} color={colors.error} /><Text style={[styles.reportText, { color: colors.error }]}>{reportMutation.isPending ? "جارٍ إرسال البلاغ..." : "الإبلاغ عن بروفايل وهمي أو غير فعال"}</Text></Pressable>
      <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>نبذة عن الحرفي</Text><Text style={[styles.bio, { color: colors.muted }]}>{provider.bio}</Text><View style={styles.location}><IconSymbol name="location.fill" size={17} color={colors.primary} /><Text style={[styles.locationText, { color: colors.muted }]}>{provider.city} · {provider.price}</Text></View></View>
      <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>الخدمات التي يقدمها</Text><View style={styles.skills}>{provider.skills.map((skill) => <View key={skill} style={[styles.skill, { backgroundColor: `${colors.primary}14` }]}><Text style={[styles.skillText, { color: colors.primary }]}>{skill}</Text></View>)}</View></View>
      <View style={styles.section}><View style={styles.reviewHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>أعمال سابقة</Text><Pressable onPress={pickPortfolioImage}><Text style={[styles.seeAll, { color: colors.primary }]}>{uploadMutation.isPending ? "جارٍ الرفع..." : "+ إضافة صورة"}</Text></Pressable></View><Text style={[styles.portfolioHint, { color: colors.muted }]}>اضغط مطولاً على صورة لحذفها من معرضك</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.portfolio}><Pressable onPress={pickPortfolioImage} style={[styles.addPortfolio, { backgroundColor: `${colors.primary}12`, borderColor: colors.primary }]}><IconSymbol name="plus" size={25} color={colors.primary} /><Text style={[styles.addPortfolioText, { color: colors.primary }]}>أضف صورة</Text></Pressable>{portfolio.length > 0 ? portfolio.map((item) => <Pressable key={item.id} onLongPress={() => confirmDelete(item.id)} style={[styles.portfolioImage, { backgroundColor: colors.surface, borderColor: colors.border }]}><Image source={{ uri: item.url }} style={styles.image} /><Text style={[styles.imageCaption, { color: colors.muted }]}>{item.caption ?? "عمل سابق"}</Text></Pressable>) : ["تركيب", "صيانة", "إنارة"].map((item) => <View key={item} style={[styles.portfolioPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.placeholderIcon, { backgroundColor: `${colors.primary}12` }]}><IconSymbol name="wrench.and.screwdriver.fill" size={23} color={colors.primary} /></View><Text style={[styles.imageCaption, { color: colors.muted }]}>{item}</Text></View>)}</ScrollView></View>
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
  shareButton: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, flexDirection: "row-reverse", alignItems: "center", gap: 5 },
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
  actionRow: { flexDirection: "row-reverse", gap: 9 },
  chatButton: { width: 52, height: 52, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  whatsappButton: { height: 52, borderRadius: 15, paddingHorizontal: 13, backgroundColor: "#25D366", flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 6 },
  whatsappText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  whatsappIcon: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" },
  callButton: { height: 52, borderRadius: 15, paddingHorizontal: 12, backgroundColor: "#2563EB", flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 5 },
  callText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  reportButton: { minHeight: 39, borderRadius: 11, borderWidth: 1, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 7 },
  reportText: { fontSize: 11, fontWeight: "800" },
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
  portfolio: { gap: 10, paddingVertical: 2 },
  portfolioHint: { fontSize: 10, textAlign: "right" },
  addPortfolio: { width: 112, height: 118, borderRadius: 15, borderWidth: 1, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 7 },
  addPortfolioText: { fontSize: 11, fontWeight: "800" },
  portfolioImage: { width: 132, height: 139, borderRadius: 15, borderWidth: 1, overflow: "hidden" },
  image: { width: "100%", height: 108 },
  imageCaption: { fontSize: 10, textAlign: "right", paddingHorizontal: 8, paddingTop: 7 },
  portfolioPlaceholder: { width: 132, height: 139, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  placeholderIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});
