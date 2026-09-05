import { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import * as Auth from "@/lib/_core/auth";
import algeriaCities from "@/data/algeria-cities.json";

const DRAFT_KEY = "khadamni_provider_registration_draft";
const wilayas = Array.from(new Set(algeriaCities.map((item) => item.wilaya_name))).sort((a, b) => a.localeCompare(b, "ar"));
const trades = ["سباكة", "كهرباء", "تكييف وتبريد", "تنظيف", "نجارة", "دهان", "بناء وترميم", "حدادة وألمنيوم", "نقل الأثاث", "بستنة وحدائق", "إصلاح الأجهزة", "مكافحة الحشرات"];

type Draft = { firstName: string; lastName: string; phone: string; wilaya: string; municipality: string; trade: string };
const emptyDraft: Draft = { firstName: "", lastName: "", phone: "", wilaya: "الجزائر", municipality: "", trade: "" };

export default function ArtisanRegisterScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [showWilayas, setShowWilayas] = useState(false);
  const [showMunicipalities, setShowMunicipalities] = useState(false);
  const [showTrades, setShowTrades] = useState(false);
  const [wilayaQuery, setWilayaQuery] = useState("");
  const municipalities = useMemo(
    () => Array.from(new Set(algeriaCities.filter((item) => item.wilaya_name === draft.wilaya).map((item) => item.commune_name))).sort((a, b) => a.localeCompare(b, "ar")),
    [draft.wilaya],
  );
  const filteredWilayas = useMemo(() => {
    const query = wilayaQuery.trim().toLocaleLowerCase("ar");
    return query ? wilayas.filter((item) => item.toLocaleLowerCase("ar").includes(query)) : wilayas;
  }, [wilayaQuery]);

  useEffect(() => {
    AsyncStorage.getItem(DRAFT_KEY)
      .then((saved) => {
        if (saved) setDraft({ ...emptyDraft, ...JSON.parse(saved) });
      })
      .catch(() => undefined);
  }, []);

  const update = (key: keyof Draft, value: string) => setDraft((current) => ({ ...current, [key]: value }));

  const openMunicipalityPicker = () => {
    if (!draft.wilaya) return;
    setShowMunicipalities((value) => !value);
    setShowWilayas(false);
    setShowTrades(false);
  };

  const openTradePicker = () => {
    setShowTrades((value) => !value);
    setShowWilayas(false);
    setShowMunicipalities(false);
  };

  const continueToSubscription = async () => {
    const phone = draft.phone.replace(/[ .-]/g, "");
    if (!draft.firstName.trim() || !draft.lastName.trim() || !phone || !draft.wilaya || !draft.municipality.trim() || !draft.trade) {
      Alert.alert("أكمل بيانات التسجيل", "أدخل الاسم واللقب ورقم الهاتف والولاية والبلدية واختر المهنة.");
      return;
    }
    if (!/^0[5-7][0-9]{8}$/.test(phone)) {
      Alert.alert("رقم الهاتف غير صحيح", "أدخل رقم هاتف جزائرياً من 10 أرقام يبدأ بـ 05 أو 06 أو 07.");
      return;
    }

    const normalizedDraft = { ...draft, phone };
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(normalizedDraft));

    if (!isAuthenticated) {
      await Auth.setPostAuthRedirect("/subscription");
    }
    router.push("/subscription");
  };

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="arrow.left" size={20} color={colors.foreground} />
            </Pressable>
            <View>
              <Text style={[styles.title, { color: colors.foreground }]}>التسجيل كحرفي</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>أدخل بياناتك ثم تابع إلى الاشتراك</Text>
            </View>
          </View>

          <View style={[styles.stepper, { backgroundColor: `${colors.primary}12` }]}>
            <View style={[styles.step, { backgroundColor: colors.primary }]}><Text style={styles.stepNumber}>1</Text></View>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            <View style={[styles.step, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.stepNumber, { color: colors.muted }]}>2</Text></View>
            <Text style={[styles.stepText, { color: colors.primary }]}>بيانات الحرفي ثم الاشتراك</Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>المعلومات الشخصية</Text>
          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={[styles.label, { color: colors.foreground }]}>الاسم</Text>
              <TextInput value={draft.firstName} onChangeText={(value) => update("firstName", value)} placeholder="مثال: محمد" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]} textAlign="right" />
            </View>
            <View style={styles.half}>
              <Text style={[styles.label, { color: colors.foreground }]}>اللقب</Text>
              <TextInput value={draft.lastName} onChangeText={(value) => update("lastName", value)} placeholder="مثال: بن علي" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]} textAlign="right" />
            </View>
          </View>

          <Text style={[styles.label, { color: colors.foreground }]}>رقم الهاتف</Text>
          <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="phone.fill" size={18} color={colors.primary} />
            <TextInput value={draft.phone} onChangeText={(value) => update("phone", value.replace(/[^0-9]/g, ""))} placeholder="05 XX XX XX XX" placeholderTextColor={colors.muted} keyboardType="phone-pad" maxLength={10} style={[styles.inputInline, { color: colors.foreground }]} textAlign="right" />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>مكان العمل</Text>
          <Text style={[styles.label, { color: colors.foreground }]}>الولاية</Text>
          <View style={[styles.select, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="chevron.down" size={17} color={colors.muted} />
            <TextInput
              value={showWilayas ? wilayaQuery : draft.wilaya}
              onFocus={() => {
                setShowWilayas(true);
                setShowMunicipalities(false);
                setShowTrades(false);
                setWilayaQuery("");
              }}
              onChangeText={(value) => {
                setWilayaQuery(value);
                setShowWilayas(true);
              }}
              placeholder="ابحث عن الولاية"
              placeholderTextColor={colors.muted}
              style={[styles.selectInput, { color: colors.foreground }]}
              textAlign="right"
              accessibilityLabel="البحث عن الولاية"
            />
          </View>
          {showWilayas && (
            <View style={[styles.optionsPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ScrollView style={styles.optionsScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                <View style={styles.options}>
                  {filteredWilayas.length > 0 ? filteredWilayas.map((item) => (
                    <Pressable key={item} onPress={() => { setDraft((current) => ({ ...current, wilaya: item, municipality: "" })); setShowWilayas(false); setWilayaQuery(""); }} style={[styles.option, { borderBottomColor: colors.border }]}>
                      <Text style={{ color: colors.foreground, fontSize: 12 }}>{item}</Text>
                    </Pressable>
                  )) : <Text style={[styles.emptyOption, { color: colors.muted }]}>لا توجد ولاية مطابقة</Text>}
                </View>
              </ScrollView>
            </View>
          )}

          <Text style={[styles.label, { color: colors.foreground }]}>البلدية</Text>
          <Pressable disabled={!draft.wilaya} onPress={openMunicipalityPicker} style={[styles.select, { backgroundColor: colors.surface, borderColor: colors.border, opacity: draft.wilaya ? 1 : 0.5 }]}>
            <IconSymbol name="chevron.down" size={17} color={colors.muted} />
            <Text style={[styles.selectText, { color: draft.municipality ? colors.foreground : colors.muted }]}>{draft.municipality || "اختر البلدية"}</Text>
          </Pressable>
          {showMunicipalities && (
            <View style={[styles.optionsPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ScrollView style={styles.optionsScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                <View style={styles.options}>
                  {municipalities.map((item) => <Pressable key={item} onPress={() => { update("municipality", item); setShowMunicipalities(false); }} style={[styles.option, { borderBottomColor: colors.border }]}><Text style={{ color: colors.foreground, fontSize: 12 }}>{item}</Text></Pressable>)}
                </View>
              </ScrollView>
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>المهنة أو الحرفة</Text>
          <Pressable onPress={openTradePicker} style={[styles.select, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="chevron.down" size={17} color={colors.muted} />
            <Text style={[styles.selectText, { color: draft.trade ? colors.foreground : colors.muted }]}>{draft.trade || "اختر المهنة أو الحرفة"}</Text>
          </Pressable>
          {showTrades && <View style={[styles.options, { backgroundColor: colors.surface, borderColor: colors.border }]}>{trades.map((item) => <Pressable key={item} onPress={() => { update("trade", item); setShowTrades(false); }} style={[styles.option, { borderBottomColor: colors.border }]}><Text style={{ color: colors.foreground, fontSize: 12 }}>{item}</Text></Pressable>)}</View>}

          <View style={[styles.info, { backgroundColor: "#E7F5F2" }]}>
            <IconSymbol name="info.circle.fill" size={19} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.muted }]}>بعد الضغط على متابعة، ستنتقل إلى اختيار باقة الاشتراك وتحميل وصل الدفع.</Text>
          </View>
          <Pressable onPress={continueToSubscription} style={({ pressed }) => [styles.submit, { backgroundColor: colors.primary }, pressed && { transform: [{ scale: 0.98 }] }]}>
            <Text style={styles.submitText}>متابعة إلى الاشتراك</Text>
            <IconSymbol name="chevron.right" size={18} color="#FFFFFF" />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingTop: 10, paddingBottom: 35, gap: 11 },
  header: { flexDirection: "row-reverse", alignItems: "center", gap: 13, marginBottom: 5 },
  back: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "800", textAlign: "right" },
  subtitle: { fontSize: 12, marginTop: 4, textAlign: "right" },
  stepper: { minHeight: 48, borderRadius: 15, paddingHorizontal: 13, flexDirection: "row-reverse", alignItems: "center", gap: 8, marginBottom: 8 },
  step: { width: 25, height: 25, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  stepNumber: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  line: { width: 27, height: 2 },
  stepText: { flex: 1, textAlign: "right", fontSize: 11, fontWeight: "800" },
  sectionTitle: { fontSize: 16, fontWeight: "800", textAlign: "right", marginTop: 12 },
  row: { flexDirection: "row-reverse", gap: 8 },
  half: { flex: 1, gap: 7 },
  label: { fontSize: 12, fontWeight: "700", textAlign: "right", marginTop: 4 },
  input: { height: 49, borderRadius: 13, borderWidth: 1, paddingHorizontal: 12, fontSize: 13 },
  inputBox: { height: 49, borderRadius: 13, borderWidth: 1, paddingHorizontal: 13, flexDirection: "row-reverse", alignItems: "center", gap: 9 },
  inputInline: { flex: 1, fontSize: 13 },
  select: { minHeight: 49, borderRadius: 13, borderWidth: 1, paddingHorizontal: 13, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  selectInput: { flex: 1, minHeight: 47, fontSize: 13, paddingVertical: 0 },
  selectText: { flex: 1, fontSize: 13, textAlign: "right" },
  optionsPanel: { borderWidth: 1, borderRadius: 13, overflow: "hidden", marginTop: -3 },
  optionsScroll: { maxHeight: 250 },
  options: { overflow: "hidden" },
  option: { minHeight: 40, paddingHorizontal: 14, justifyContent: "center", alignItems: "flex-end", borderBottomWidth: 1 },
  emptyOption: { paddingHorizontal: 14, paddingVertical: 14, textAlign: "right", fontSize: 12 },
  info: { marginTop: 12, borderRadius: 13, padding: 12, flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  infoText: { flex: 1, fontSize: 11, lineHeight: 18, textAlign: "right" },
  submit: { height: 53, marginTop: 7, borderRadius: 15, flexDirection: "row-reverse", justifyContent: "center", alignItems: "center", gap: 8 },
  submitText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
});
