import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Auth from "@/lib/_core/auth";

export default function ArtisanLoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const login = trpc.auth.loginProvider.useMutation();

  const submit = async () => {
    const normalizedPhone = phone.replace(/[ .-]/g, "");
    if (!/^0[5-7][0-9]{8}$/.test(normalizedPhone) || !password) {
      Alert.alert("بيانات الدخول ناقصة", "أدخل رقم الهاتف وكلمة المرور الصحيحة.");
      return;
    }
    try {
      const result = await login.mutateAsync({ phone: normalizedPhone, password });
      await Auth.setSessionToken(result.sessionToken);
      await Auth.setUserInfo(result.user);
      router.replace("/dashboard");
    } catch (error) {
      Alert.alert("تعذر تسجيل الدخول", error instanceof Error ? error.message : "تحقق من بياناتك وحاول مرة أخرى.");
    }
  };

  return <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.content}>
        <View style={styles.header}><Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="arrow.left" size={20} color={colors.foreground} /></Pressable><View><Text style={[styles.title, { color: colors.foreground }]}>دخول الحرفي</Text><Text style={[styles.subtitle, { color: colors.muted }]}>ادخل إلى حسابك وبروفايلك المهني</Text></View></View>
        <Text style={[styles.label, { color: colors.foreground }]}>رقم الهاتف</Text>
        <TextInput value={phone} onChangeText={(value) => setPhone(value.replace(/[^0-9]/g, ""))} placeholder="05 XX XX XX XX" placeholderTextColor={colors.muted} keyboardType="phone-pad" maxLength={10} style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]} textAlign="right" />
        <Text style={[styles.label, { color: colors.foreground }]}>كلمة المرور</Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="كلمة المرور" placeholderTextColor={colors.muted} secureTextEntry style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]} textAlign="right" />
        <Pressable disabled={login.isPending} onPress={submit} style={({ pressed }) => [styles.submit, { backgroundColor: colors.primary, opacity: login.isPending ? 0.6 : 1 }, pressed && { transform: [{ scale: 0.98 }] }]}><Text style={styles.submitText}>{login.isPending ? "جارٍ الدخول..." : "تسجيل الدخول"}</Text><IconSymbol name="chevron.right" size={18} color="#FFFFFF" /></Pressable>
        <Pressable onPress={() => router.replace("/artisan-register")}><Text style={[styles.registerLink, { color: colors.primary }]}>ليس لديك حساب؟ سجّل كحرفي جديد</Text></Pressable>
      </View>
    </KeyboardAvoidingView>
  </ScreenContainer>;
}

const styles = StyleSheet.create({ flex: { flex: 1 }, content: { paddingTop: 10, gap: 12 }, header: { flexDirection: "row-reverse", alignItems: "center", gap: 13, marginBottom: 22 }, back: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" }, title: { fontSize: 26, fontWeight: "800", textAlign: "right" }, subtitle: { fontSize: 12, marginTop: 4, textAlign: "right" }, label: { fontSize: 12, fontWeight: "700", textAlign: "right", marginTop: 4 }, input: { height: 50, borderRadius: 13, borderWidth: 1, paddingHorizontal: 12, fontSize: 13 }, submit: { height: 53, marginTop: 12, borderRadius: 15, flexDirection: "row-reverse", justifyContent: "center", alignItems: "center", gap: 8 }, submitText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" }, registerLink: { textAlign: "center", fontSize: 12, fontWeight: "800", marginTop: 8 } });
