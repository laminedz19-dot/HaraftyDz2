import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Location from "expo-location";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { startOAuthLogin } from "@/constants/oauth";
import { ServiceMap } from "@/components/service-map";

const categories = [{ id: "plumbing", label: "سباكة" }, { id: "electric", label: "كهرباء" }, { id: "ac", label: "تكييف" }, { id: "cleaning", label: "تنظيف" }, { id: "carpentry", label: "نجارة" }, { id: "painting", label: "دهان" }];
const dates = ["اليوم", "غداً", "بعد غد"];

export default function RequestScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const params = useLocalSearchParams<{ category?: string; providerId?: string }>();
  const [category, setCategory] = useState(params.category ?? "plumbing");
  const [date, setDate] = useState("اليوم");
  const [time, setTime] = useState("16:00");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState({ latitude: 36.7538, longitude: 3.0588 });
  const [locationLoading, setLocationLoading] = useState(false);
  const requestMutation = trpc.requests.create.useMutation();
  const selectedCategory = categories.find((item) => item.id === category)?.label ?? "سباكة";
  const useCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") { Alert.alert("الموقع غير متاح", "اسمح للتطبيق بالوصول إلى موقعك لتحديد عنوان الخدمة."); return; }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ latitude: current.coords.latitude, longitude: current.coords.longitude });
      Alert.alert("تم تحديد الموقع", "تم استخدام موقعك الحالي كعنوان تقريبي للخدمة.");
    } catch { Alert.alert("تعذر تحديد الموقع", "أدخل العنوان يدوياً أو حاول مرة أخرى."); } finally { setLocationLoading(false); }
  };

  const submit = async () => {
    if (!isAuthenticated || !user) {
      Alert.alert("تسجيل الدخول مطلوب", "سجّل الدخول أولاً حتى نتمكن من حفظ طلبك ومتابعته.", [{ text: "لاحقاً", style: "cancel" }, { text: "تسجيل الدخول", onPress: () => startOAuthLogin() }]);
      return;
    }
    if (!address.trim()) {
      Alert.alert("أكمل البيانات", "أدخل عنوان الخدمة حتى يتمكن الحرفي من الوصول إليك.");
      return;
    }
    try {
      await requestMutation.mutateAsync({ providerId: params.providerId ? Number(params.providerId) : undefined, category, subcategory: selectedCategory, description, address, latitude: String(coords.latitude), longitude: String(coords.longitude), scheduledAt: new Date() });
      Alert.alert("تم إرسال الطلب", "سنرسل لك عروض الحرفيين ونحدّثك بحالة الطلب.", [{ text: "عرض طلباتي", onPress: () => router.replace("/(tabs)/requests") }]);
    } catch (error) {
      Alert.alert("تعذر إرسال الطلب", "تحقق من الاتصال وحاول مرة أخرى.");
    }
  };

  return <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.header}><Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="arrow.left" size={20} color={colors.foreground} /></Pressable><View><Text style={[styles.title, { color: colors.foreground }]}>طلب خدمة</Text><Text style={[styles.subtitle, { color: colors.muted }]}>أخبرنا بما تحتاج وسنتكفل بالباقي</Text></View></View>
      <View style={[styles.stepper, { backgroundColor: `${colors.primary}12` }]}><View style={[styles.stepCircle, { backgroundColor: colors.primary }]}><Text style={styles.stepNumber}>1</Text></View><View style={[styles.stepLine, { backgroundColor: colors.primary }]} /><View style={[styles.stepCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.stepNumber, { color: colors.muted }]}>2</Text></View><View style={[styles.stepLine, { backgroundColor: colors.border }]} /><View style={[styles.stepCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.stepNumber, { color: colors.muted }]}>3</Text></View><Text style={[styles.stepText, { color: colors.primary }]}>تفاصيل الطلب</Text></View>
      <View style={styles.section}><Text style={[styles.label, { color: colors.foreground }]}>نوع الخدمة</Text><View style={styles.categoryGrid}>{categories.map((item) => <Pressable key={item.id} onPress={() => setCategory(item.id)} style={[styles.category, { backgroundColor: category === item.id ? colors.primary : colors.surface, borderColor: category === item.id ? colors.primary : colors.border }]}><Text style={{ color: category === item.id ? "#FFFFFF" : colors.foreground, fontSize: 12, fontWeight: "700" }}>{item.label}</Text></Pressable>)}</View></View>
      <View style={styles.section}><Text style={[styles.label, { color: colors.foreground }]}>متى تحتاج الخدمة؟</Text><View style={styles.dateRow}>{dates.map((item) => <Pressable key={item} onPress={() => setDate(item)} style={[styles.date, { backgroundColor: date === item ? colors.primary : colors.surface, borderColor: date === item ? colors.primary : colors.border }]}><Text style={{ color: date === item ? "#FFFFFF" : colors.foreground, fontSize: 12, fontWeight: "700" }}>{item}</Text></Pressable>)}<View style={[styles.timeInput, { backgroundColor: colors.surface, borderColor: colors.border }]}><TextInput value={time} onChangeText={setTime} style={{ color: colors.foreground, fontSize: 12, textAlign: "center" }} keyboardType="numbers-and-punctuation" /></View></View></View>
      <View style={styles.section}><Text style={[styles.label, { color: colors.foreground }]}>عنوان الخدمة</Text><View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="location.fill" size={19} color={colors.primary} /><TextInput value={address} onChangeText={setAddress} placeholder="الحي، الشارع، رقم المنزل" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground }]} textAlign="right" /></View></View>
      <View style={styles.section}><View style={styles.locationHeader}><Text style={[styles.label, { color: colors.foreground }]}>موقع الخدمة على الخريطة</Text><Pressable onPress={useCurrentLocation}><Text style={[styles.locationAction, { color: colors.primary }]}>{locationLoading ? "جارٍ التحديد..." : "استخدم موقعي"}</Text></Pressable></View><ServiceMap latitude={coords.latitude} longitude={coords.longitude} onSelect={(latitude, longitude) => setCoords({ latitude, longitude })} /><Text style={[styles.mapHint, { color: colors.muted }]}>اضغط على الخريطة لتعديل النقطة التقريبية</Text></View>
      <View style={styles.section}><Text style={[styles.label, { color: colors.foreground }]}>اشرح ما تحتاجه <Text style={{ color: colors.muted, fontSize: 11 }}>(اختياري)</Text></Text><View style={[styles.notesBox, { backgroundColor: colors.surface, borderColor: colors.border }]}><TextInput value={description} onChangeText={setDescription} placeholder="أضف أي تفاصيل أو صور مهمة للحرفي..." placeholderTextColor={colors.muted} style={[styles.notes, { color: colors.foreground }]} textAlign="right" multiline numberOfLines={4} /></View></View>
      <View style={[styles.summary, { backgroundColor: "#E7F5F2" }]}><View style={styles.summaryIcon}><IconSymbol name="wrench.and.screwdriver.fill" size={21} color={colors.primary} /></View><View style={styles.summaryCopy}><Text style={[styles.summaryTitle, { color: colors.foreground }]}>طلب {selectedCategory}</Text><Text style={[styles.summaryText, { color: colors.muted }]}>{date} · {time} · {address || "لم يحدد العنوان بعد"}</Text></View></View>
      <Pressable disabled={requestMutation.isPending} onPress={submit} style={({ pressed }) => [styles.submit, { backgroundColor: colors.primary, opacity: requestMutation.isPending ? 0.6 : 1 }, pressed && { transform: [{ scale: 0.98 }] }]}><Text style={styles.submitText}>{requestMutation.isPending ? "جارٍ الإرسال..." : "إرسال طلب الخدمة"}</Text><IconSymbol name="chevron.right" size={18} color="#FFFFFF" /></Pressable>
    </ScrollView>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 10, paddingBottom: 35, gap: 20 },
  header: { flexDirection: "row-reverse", alignItems: "center", gap: 13 },
  back: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 27, fontWeight: "800", textAlign: "right" },
  subtitle: { fontSize: 12, marginTop: 4, textAlign: "right" },
  stepper: { minHeight: 49, borderRadius: 15, paddingHorizontal: 12, flexDirection: "row-reverse", alignItems: "center", gap: 7 },
  stepCircle: { width: 25, height: 25, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  stepNumber: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  stepLine: { height: 2, width: 25 },
  stepText: { flex: 1, textAlign: "right", fontSize: 12, fontWeight: "800" },
  section: { gap: 10 },
  label: { fontSize: 14, fontWeight: "800", textAlign: "right" },
  categoryGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  category: { minWidth: "30%", flex: 1, height: 39, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  dateRow: { flexDirection: "row-reverse", gap: 7, alignItems: "center" },
  date: { flex: 1, height: 42, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  timeInput: { width: 68, height: 42, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  inputBox: { height: 51, borderWidth: 1, borderRadius: 14, flexDirection: "row-reverse", alignItems: "center", paddingHorizontal: 14, gap: 8 },
  input: { flex: 1, fontSize: 13 },
  locationHeader: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  locationAction: { fontSize: 11, fontWeight: "800" },
  mapHint: { fontSize: 10, textAlign: "right" },
  notesBox: { minHeight: 104, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 10 },
  notes: { flex: 1, fontSize: 13, minHeight: 80, textAlignVertical: "top" },
  summary: { borderRadius: 16, padding: 13, flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  summaryIcon: { width: 39, height: 39, borderRadius: 12, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  summaryCopy: { flex: 1, gap: 4 },
  summaryTitle: { fontSize: 13, fontWeight: "800", textAlign: "right" },
  summaryText: { fontSize: 11, textAlign: "right" },
  submit: { height: 53, borderRadius: 15, flexDirection: "row-reverse", justifyContent: "center", alignItems: "center", gap: 9 },
  submitText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
});
