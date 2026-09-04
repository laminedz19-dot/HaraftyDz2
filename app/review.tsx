import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function ReviewScreen() {
  const colors = useColors();
  const router = useRouter();
  const { requestId, providerName } = useLocalSearchParams<{ requestId?: string; providerName?: string }>();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const reviewMutation = trpc.reviews.submit.useMutation({ onSuccess: () => { Alert.alert("شكراً لتقييمك", "تمت إضافة تقييمك بنجاح.", [{ text: "عودة إلى طلباتي", onPress: () => router.replace("/(tabs)/requests") }]); } });
  const submit = async () => {
    if (!requestId) return;
    try { await reviewMutation.mutateAsync({ requestId: Number(requestId), rating, comment: comment.trim() || undefined }); } catch (error) { Alert.alert("تعذر إرسال التقييم", error instanceof Error ? error.message : "حاول مرة أخرى لاحقاً."); }
  };
  return <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="arrow.left" size={20} color={colors.foreground} /></Pressable><View><Text style={[styles.title, { color: colors.foreground }]}>قيّم تجربتك</Text><Text style={[styles.subtitle, { color: colors.muted }]}>ساعد الآخرين على اختيار الحرفي المناسب</Text></View></View>
      <View style={[styles.hero, { backgroundColor: "#E7F5F2" }]}><View style={[styles.heroIcon, { backgroundColor: colors.primary }]}><IconSymbol name="star.fill" size={27} color="#FFFFFF" /></View><Text style={[styles.heroTitle, { color: colors.foreground }]}>كيف كانت خدمتك مع {providerName || "الحرفي"}؟</Text><Text style={[styles.heroText, { color: colors.muted }]}>رأيك مهم لتحسين تجربة الجميع في خدمني</Text></View>
      <View style={styles.ratingBox}><Text style={[styles.ratingLabel, { color: colors.foreground }]}>اختر التقييم</Text><View style={styles.stars}>{[1, 2, 3, 4, 5].map((value) => <Pressable key={value} onPress={() => setRating(value)} hitSlop={7}><Text style={[styles.star, { color: value <= rating ? "#E7A928" : colors.border }]}>★</Text></Pressable>)}</View><Text style={[styles.ratingText, { color: colors.primary }]}>{rating === 5 ? "ممتاز" : rating === 4 ? "جيد جداً" : rating === 3 ? "جيد" : rating === 2 ? "يحتاج تحسين" : "غير مرضٍ"}</Text></View>
      <View style={styles.section}><Text style={[styles.label, { color: colors.foreground }]}>اكتب تعليقاً <Text style={{ color: colors.muted, fontSize: 11 }}>(اختياري)</Text></Text><View style={[styles.notesBox, { backgroundColor: colors.surface, borderColor: colors.border }]}><TextInput value={comment} onChangeText={setComment} placeholder="شارك تفاصيل تجربتك مع الآخرين..." placeholderTextColor={colors.muted} style={[styles.notes, { color: colors.foreground }]} textAlign="right" multiline numberOfLines={5} /></View></View>
      <View style={[styles.privacy, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} /><Text style={[styles.privacyText, { color: colors.muted }]}>سيظهر تقييمك باسمك الأول فقط ويمكنك تعديله لاحقاً.</Text></View>
      <Pressable disabled={reviewMutation.isPending} onPress={submit} style={({ pressed }) => [styles.submit, { backgroundColor: colors.primary, opacity: reviewMutation.isPending ? 0.6 : 1 }, pressed && { transform: [{ scale: 0.98 }] }]}><Text style={styles.submitText}>{reviewMutation.isPending ? "جارٍ الإرسال..." : "إرسال التقييم"}</Text><IconSymbol name="chevron.right" size={18} color="#FFFFFF" /></Pressable>
    </ScrollView>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 10, paddingBottom: 35, gap: 20 },
  header: { flexDirection: "row-reverse", alignItems: "center", gap: 13 },
  back: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 27, fontWeight: "800", textAlign: "right" },
  subtitle: { fontSize: 12, textAlign: "right", marginTop: 4 },
  hero: { alignItems: "center", borderRadius: 21, padding: 20, gap: 8 },
  heroIcon: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 3 },
  heroTitle: { fontSize: 17, fontWeight: "800", textAlign: "center" },
  heroText: { fontSize: 12, textAlign: "center" },
  ratingBox: { alignItems: "center", gap: 8 },
  ratingLabel: { fontSize: 14, fontWeight: "800" },
  stars: { flexDirection: "row", gap: 9 },
  star: { fontSize: 38 },
  ratingText: { fontSize: 13, fontWeight: "800" },
  section: { gap: 10 },
  label: { fontSize: 14, fontWeight: "800", textAlign: "right" },
  notesBox: { minHeight: 125, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 10 },
  notes: { flex: 1, fontSize: 13, minHeight: 100, textAlignVertical: "top" },
  privacy: { minHeight: 50, borderRadius: 14, borderWidth: 1, padding: 12, flexDirection: "row-reverse", alignItems: "center", gap: 9 },
  privacyText: { flex: 1, fontSize: 11, textAlign: "right" },
  submit: { height: 53, borderRadius: 15, flexDirection: "row-reverse", justifyContent: "center", alignItems: "center", gap: 9 },
  submitText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
});
