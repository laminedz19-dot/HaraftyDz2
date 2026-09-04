import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { startOAuthLogin } from "@/constants/oauth";
import { trpc } from "@/lib/trpc";

const items = [
  { icon: "person.crop.circle.fill" as const, label: "بياناتي الشخصية", detail: "الاسم، الهاتف، العنوان" },
  { icon: "location.fill" as const, label: "عناويني المحفوظة", detail: "الجزائر العاصمة" },
  { icon: "bell.fill" as const, label: "الإشعارات", detail: "مفعّلة" },
];

export default function ProfileScreen() {
  const colors = useColors();
  const { user, isAuthenticated, logout } = useAuth();
  const accountMutation = trpc.accounts.setType.useMutation();
  const displayName = user?.name || "زائر خدمني";
  return <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
    <Text style={[styles.title, { color: colors.foreground }]}>حسابي</Text>
    <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
      <View style={styles.profileAvatar}><Text style={[styles.profileInitial, { color: colors.primary }]}>ز</Text></View>
      <View style={styles.profileCopy}><Text style={styles.profileName}>{displayName}</Text><Text style={styles.profileSub}>{isAuthenticated ? "حسابك متصل ويمكنك متابعة طلباتك" : "أكمل ملفك للحصول على تجربة أفضل"}</Text></View>
      <Pressable onPress={() => isAuthenticated ? logout() : startOAuthLogin()} style={styles.loginButton}><Text style={[styles.loginText, { color: colors.primary }]}>{isAuthenticated ? "خروج" : "دخول"}</Text></Pressable>
    </View>
    <Pressable onPress={async () => { if (!isAuthenticated) { await startOAuthLogin(); return; } await accountMutation.mutateAsync({ accountType: "provider" }); Alert.alert("تم تفعيل حساب الحرفي", "يمكنك الآن إكمال ملفك وإضافة خدماتك."); }} style={[styles.artisanCard, { backgroundColor: "#E7F5F2" }]}><View style={[styles.artisanIcon, { backgroundColor: colors.primary }]}><IconSymbol name="wrench.and.screwdriver.fill" size={21} color="#FFFFFF" /></View><View style={styles.artisanCopy}><Text style={[styles.artisanTitle, { color: colors.foreground }]}>هل أنت حرفي؟</Text><Text style={[styles.artisanBody, { color: colors.muted }]}>{isAuthenticated ? "فعّل حساب الحرفي واستقبل طلبات جديدة" : "سجّل الدخول وقدّم خدماتك لعملاء جدد"}</Text></View><IconSymbol name="chevron.right" size={18} color={colors.primary} /></Pressable>
    <Text style={[styles.section, { color: colors.foreground }]}>الإعدادات</Text>
    <View style={[styles.settings, { backgroundColor: colors.surface, borderColor: colors.border }]}>{items.map((item) => <Pressable key={item.label} onPress={() => Alert.alert(item.label, "هذه الخاصية متاحة من ملفك الشخصي.")} style={({ pressed }) => [styles.settingRow, { borderBottomColor: colors.border }, pressed && { opacity: 0.7 }]}><View style={[styles.settingIcon, { backgroundColor: `${colors.primary}14` }]}><IconSymbol name={item.icon} size={20} color={colors.primary} /></View><View style={styles.settingCopy}><Text style={[styles.settingLabel, { color: colors.foreground }]}>{item.label}</Text><Text style={[styles.settingDetail, { color: colors.muted }]}>{item.detail}</Text></View><IconSymbol name="chevron.right" size={16} color={colors.muted} /></Pressable>)}</View>
    <Text style={[styles.footer, { color: colors.muted }]}>خدمني · ابحث عن الأفضل بالقرب منك</Text>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  title: { fontSize: 27, fontWeight: "800", textAlign: "right", marginTop: 10, marginBottom: 22 },
  profileCard: { borderRadius: 21, padding: 18, flexDirection: "row-reverse", alignItems: "center", gap: 11 },
  profileAvatar: { width: 51, height: 51, borderRadius: 17, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  profileInitial: { fontSize: 21, fontWeight: "900" },
  profileCopy: { flex: 1 },
  profileName: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", textAlign: "right" },
  profileSub: { color: "#D8F7F1", fontSize: 11, textAlign: "right", marginTop: 4 },
  loginButton: { backgroundColor: "#FFFFFF", borderRadius: 11, paddingVertical: 9, paddingHorizontal: 12 },
  loginText: { fontSize: 12, fontWeight: "800" },
  artisanCard: { borderRadius: 19, padding: 15, flexDirection: "row-reverse", alignItems: "center", gap: 11, marginTop: 18 },
  artisanIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  artisanCopy: { flex: 1 },
  artisanTitle: { fontSize: 14, fontWeight: "800", textAlign: "right" },
  artisanBody: { fontSize: 11, textAlign: "right", marginTop: 4 },
  section: { fontSize: 18, fontWeight: "800", textAlign: "right", marginTop: 27, marginBottom: 12 },
  settings: { borderWidth: 1, borderRadius: 19, paddingHorizontal: 15 },
  settingRow: { minHeight: 69, flexDirection: "row-reverse", alignItems: "center", gap: 11, borderBottomWidth: 1 },
  settingIcon: { width: 35, height: 35, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  settingCopy: { flex: 1 },
  settingLabel: { fontSize: 13, fontWeight: "800", textAlign: "right" },
  settingDetail: { fontSize: 11, textAlign: "right", marginTop: 3 },
  footer: { textAlign: "center", fontSize: 11, marginTop: 28 },
});
