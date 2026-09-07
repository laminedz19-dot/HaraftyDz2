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
    <Pressable onPress={() => router.push("/artisan-register")} style={[styles.artisanCard, { backgroundColor: "#E7F5F2" }]}><View style={[styles.artisanIcon, { backgroundColor: colors.primary }]}><IconSymbol name="wrench.and.screwdriver.fill" size={21} color="#FFFFFF" /></View><View style={styles.artisanCopy}><Text style={[styles.artisanTitle, { color: colors.foreground }]}>تسجيل حرفي جديد</Text><Text style={[styles.artisanBody, { color: colors.muted }]}>أنشئ حسابك وملفك مجاناً، ثم اشترك عند النشر</Text></View><IconSymbol name="chevron.right" size={18} color={colors.primary} /></Pressable>
    <Pressable onPress={() => router.push("/artisan-login")} style={[styles.artisanCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}><View style={[styles.artisanIcon, { backgroundColor: `${colors.primary}14` }]}><IconSymbol name="person.fill" size={21} color={colors.primary} /></View><View style={styles.artisanCopy}><Text style={[styles.artisanTitle, { color: colors.foreground }]}>دخول الحرفي</Text><Text style={[styles.artisanBody, { color: colors.muted }]}>ادخل إلى بروفايلك ولوحة التحكم</Text></View><IconSymbol name="chevron.right" size={18} color={colors.primary} /></Pressable>
    <Text style={[styles.footer, { color: colors.muted }]}>خدمني · ابحث عن الأفضل بالقرب منك</Text>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  title: { fontSize: 27, fontWeight: "800", textAlign: "right", marginTop: 10, marginBottom: 22 },
  profileCopy: { flex: 1 },
  artisanCard: { borderRadius: 19, padding: 15, flexDirection: "row-reverse", alignItems: "center", gap: 11, marginTop: 18 },
  artisanIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  artisanCopy: { flex: 1 },
  artisanTitle: { fontSize: 14, fontWeight: "800", textAlign: "right" },
  artisanBody: { fontSize: 11, textAlign: "right", marginTop: 4 },
  footer: { textAlign: "center", fontSize: 11, marginTop: 28 },
});
