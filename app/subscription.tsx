import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { startOAuthLogin } from "@/constants/oauth";
import * as Auth from "@/lib/_core/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DRAFT_KEY = "khadamni_provider_registration_draft";

const planStyles = {
  monthly: { label: "شهري", duration: "30 يوماً" },
  seasonal: { label: "موسمي", duration: "90 يوماً" },
  yearly: { label: "سنوي", duration: "365 يوماً" },
} as const;
type PlanId = keyof typeof planStyles;
type ReceiptMime = "image/jpeg" | "image/png" | "image/webp" | "application/pdf";

export default function SubscriptionScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const plansQuery = trpc.subscriptions.plans.useQuery();
  const historyQuery = trpc.subscriptions.mine.useQuery(undefined, { enabled: isAuthenticated });
  const uploadMutation = trpc.subscriptions.submitReceipt.useMutation({
    onSuccess: (result) => {
      historyQuery.refetch();
      Alert.alert("تم استلام الوصل", `الفحص الآلي: ${result.verdict === "likely_forged" ? "يحتاج مراجعة عاجلة" : "قيد المراجعة"}. لن يتم تفعيل الاشتراك قبل موافقة الإدارة.`);
    },
  });
  const [selected, setSelected] = useState<PlanId>("monthly");
  const [fileName, setFileName] = useState("");
  const [fileData, setFileData] = useState<{ base64: string; mimeType: ReceiptMime } | null>(null);
  const [providerDraft, setProviderDraft] = useState<string | undefined>();
  useEffect(() => { AsyncStorage.getItem(DRAFT_KEY).then((draft) => setProviderDraft(draft || undefined)).catch(() => undefined); }, []);
  const fallbackPlans = [
    { id: "monthly" as const, label: "شهري", price: 1400, duration: "30 يوماً" },
    { id: "seasonal" as const, label: "موسمي", price: 4000, duration: "90 يوماً" },
    { id: "yearly" as const, label: "سنوي", price: 15000, duration: "365 يوماً" },
  ];
  const plans = plansQuery.data?.plans ?? fallbackPlans;

  const pickReceipt = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ["image/*", "application/pdf"], copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const allowed: ReceiptMime[] = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const mimeType = allowed.includes(asset.mimeType as ReceiptMime) ? asset.mimeType as ReceiptMime : "image/jpeg";
    try {
      const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
      setFileName(asset.name);
      setFileData({ base64, mimeType });
    } catch {
      Alert.alert("تعذر قراءة الملف", "اختر صورة أو ملف PDF صالحاً.");
    }
  };

  const submit = () => {
    if (!isAuthenticated || !user) {
      Alert.alert("دخول الحرفي مطلوب", "هذه الصفحة مخصصة للحرفيين فقط. سجّل الدخول لإرسال الوصل وربط الاشتراك بحسابك.", [
        { text: "لاحقاً", style: "cancel" },
        { text: "تسجيل الدخول", onPress: async () => { await Auth.setPostAuthRedirect("/subscription"); await startOAuthLogin(); } },
      ]);
      return;
    }
    if (!fileData) {
      Alert.alert("أرفق الوصل أولاً", "اختر صورة أو ملف PDF لوصل التحويل.");
      return;
    }
    uploadMutation.mutate({ plan: selected, base64: fileData.base64, mimeType: fileData.mimeType, providerDraft });
  };

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="arrow.left" size={20} color={colors.foreground} />
          </Pressable>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>الاشتراك</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>فعّل حسابك واستفد من كامل الخدمات</Text>
          </View>
        </View>

        <View style={[styles.notice, { backgroundColor: "#FFF6DE", borderColor: "#F2D38A" }]}> 
          <IconSymbol name="info.circle.fill" size={20} color={colors.warning} />
          <Text style={[styles.noticeText, { color: colors.foreground }]}>يتم تفعيل الاشتراك بعد مراجعة وصل الدفع يدوياً. الفحص الآلي يساعد الإدارة ولا يثبت صحة التحويل وحده.</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>اختر الباقة</Text>
        <View style={styles.plans}>
          {plans.map((plan) => (
            <Pressable key={plan.id} onPress={() => setSelected(plan.id as PlanId)} style={[styles.plan, { backgroundColor: selected === plan.id ? `${colors.primary}12` : colors.surface, borderColor: selected === plan.id ? colors.primary : colors.border }]}>
              <View style={[styles.radio, { borderColor: selected === plan.id ? colors.primary : colors.border }]}>{selected === plan.id && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}</View>
              <View style={styles.planCopy}><Text style={[styles.planLabel, { color: colors.foreground }]}>{plan.label}</Text><Text style={[styles.planDuration, { color: colors.muted }]}>{plan.duration}</Text></View>
              <Text style={[styles.price, { color: colors.primary }]}>{plan.price.toLocaleString("ar-DZ")} دج</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>بيانات التحويل</Text>
        <View style={[styles.paymentBox, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.paymentRow}><Text selectable style={[styles.paymentValue, { color: colors.foreground }]}>007999990008761821</Text><Text style={[styles.paymentLabel, { color: colors.muted }]}>رقم الحساب</Text></View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.paymentRow}><Text selectable style={[styles.paymentValue, { color: colors.primary }]}>94</Text><Text style={[styles.paymentLabel, { color: colors.muted }]}>المفتاح</Text></View>
        </View>
        <Text style={[styles.helper, { color: colors.muted }]}>حوّل مبلغ {plans.find((plan) => plan.id === selected)?.price.toLocaleString("ar-DZ")} دج ثم أرفق الوصل هنا.</Text>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>وصل الدفع</Text>
        <Pressable onPress={pickReceipt} style={[styles.upload, { backgroundColor: colors.surface, borderColor: fileName ? colors.primary : colors.border }]}> 
          <View style={[styles.uploadIcon, { backgroundColor: `${colors.primary}14` }]}><IconSymbol name={fileName ? "checkmark.circle.fill" : "arrow.up.doc.fill"} size={22} color={colors.primary} /></View>
          <View style={styles.uploadCopy}><Text style={[styles.uploadTitle, { color: colors.foreground }]}>{fileName || "تحميل صورة أو PDF الوصل"}</Text><Text style={[styles.uploadText, { color: colors.muted }]}>{fileName ? "اضغط لاختيار ملف آخر" : "يجب أن يكون الوصل واضحاً وغير معدل"}</Text></View>
          <IconSymbol name="chevron.right" size={18} color={colors.muted} />
        </Pressable>

        <Pressable disabled={uploadMutation.isPending} onPress={submit} style={({ pressed }) => [styles.submit, { backgroundColor: colors.primary, opacity: uploadMutation.isPending ? 0.6 : 1 }, pressed && { transform: [{ scale: 0.98 }] }]}>
          <Text style={styles.submitText}>{uploadMutation.isPending ? "جارٍ فحص الوصل..." : "إرسال الوصل للمراجعة"}</Text>
          <IconSymbol name="chevron.right" size={18} color="#FFFFFF" />
        </Pressable>

        {isAuthenticated && (historyQuery.data?.length ?? 0) > 0 && (
          <View style={styles.history}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>آخر الطلبات</Text>
            {historyQuery.data?.slice(0, 3).map((payment) => (
              <View key={payment.id} style={[styles.historyRow, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                <Text style={[styles.historyStatus, { color: payment.status === "approved" ? colors.success : payment.status === "rejected" ? colors.error : colors.warning }]}>{payment.status === "approved" ? "مقبول" : payment.status === "rejected" ? "مرفوض" : "قيد المراجعة"}</Text>
                <View><Text style={[styles.historyPlan, { color: colors.foreground }]}>{planStyles[payment.plan].label} · {payment.amount.toLocaleString("ar-DZ")} دج</Text><Text style={[styles.historyDate, { color: colors.muted }]}>{new Date(payment.createdAt).toLocaleDateString("ar-DZ")}</Text></View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 10, paddingBottom: 35, gap: 16 },
  header: { flexDirection: "row-reverse", alignItems: "center", gap: 13 },
  back: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 27, fontWeight: "800", textAlign: "right" },
  subtitle: { fontSize: 12, textAlign: "right", marginTop: 4 },
  notice: { borderRadius: 15, borderWidth: 1, padding: 13, flexDirection: "row-reverse", alignItems: "center", gap: 9 },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 18, textAlign: "right" },
  sectionTitle: { fontSize: 16, fontWeight: "800", textAlign: "right", marginTop: 4 },
  plans: { gap: 9 },
  plan: { minHeight: 72, borderRadius: 15, borderWidth: 1, padding: 13, flexDirection: "row-reverse", alignItems: "center", gap: 11 },
  radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 11, height: 11, borderRadius: 6 },
  planCopy: { flex: 1, gap: 3 },
  planLabel: { fontSize: 14, fontWeight: "800", textAlign: "right" },
  planDuration: { fontSize: 10, textAlign: "right" },
  price: { fontSize: 15, fontWeight: "900" },
  paymentBox: { borderWidth: 1, borderRadius: 15, padding: 14, gap: 12 },
  paymentRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  paymentLabel: { fontSize: 11 },
  paymentValue: { fontSize: 16, fontWeight: "900", letterSpacing: 1 },
  divider: { height: 1 },
  helper: { fontSize: 11, textAlign: "right" },
  upload: { borderWidth: 1.5, borderStyle: "dashed", borderRadius: 15, minHeight: 76, padding: 13, flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  uploadIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  uploadCopy: { flex: 1, gap: 4 },
  uploadTitle: { fontSize: 13, fontWeight: "800", textAlign: "right" },
  uploadText: { fontSize: 10, textAlign: "right" },
  submit: { height: 53, borderRadius: 15, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 3 },
  submitText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  history: { gap: 10, marginTop: 6 },
  historyRow: { borderWidth: 1, borderRadius: 13, padding: 12, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  historyStatus: { fontSize: 11, fontWeight: "800" },
  historyPlan: { fontSize: 12, fontWeight: "800", textAlign: "right" },
  historyDate: { fontSize: 10, textAlign: "right", marginTop: 3 },
});
