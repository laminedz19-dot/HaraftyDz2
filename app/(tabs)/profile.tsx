import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  return <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
    <Text style={[styles.title, { color: colors.foreground }]}>حسابي</Text>
    <View style={[styles.profileCard, { backgroundColor: colors.primary }]}> 
      <View style={styles.profileAvatar}><Text style={[styles.profileInitial, { color: colors.primary }]}>ز</Text></View>
      <View style={styles.profileCopy}><Text style={styles.profileName}>زائر خدمني</Text><Text style={styles.profileSub}>تصفح خدمات الحرفيين دون تسجيل أو دخول</Text></View>
    </View>
    <Pressable onPress={() => router.push("/artisan-register")} style={[styles.artisanCard, { backgroundColor: "#E7F5F2" }]}><View style={[styles.artisanIcon, { backgroundColor: colors.primary }]}><IconSymbol name="wrench.and.screwdriver.fill" size={21} color="#FFFFFF" /></View><View style={styles.artisanCopy}><Text style={[styles.artisanTitle, { color: colors.foreground }]}>دخول أو تسجيل الحرفي</Text><Text style={[styles.artisanBody, { color: colors.muted }]}>أنشئ ملفك المهني ثم اختر باقة الاشتراك</Text></View><IconSymbol name="chevron.right" size={18} color={colors.primary} /></Pressable>
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
  footer: { textAlign: "center", fontSize: 11, marginTop: 28 },
});
