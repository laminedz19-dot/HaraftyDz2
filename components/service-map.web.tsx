import { Pressable, StyleSheet, Text, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

type Props = { latitude: number; longitude: number; onSelect: (latitude: number, longitude: number) => void };

export function ServiceMap({ onSelect }: Props) {
  const colors = useColors();
  return <Pressable onPress={() => onSelect(36.7538, 3.0588)} style={[styles.fallback, { backgroundColor: "#DCEFEA", borderColor: colors.border }]}><IconSymbol name="location.fill" size={28} color={colors.primary} /><Text style={[styles.text, { color: colors.foreground }]}>الجزائر العاصمة</Text><Text style={[styles.hint, { color: colors.muted }]}>اضغط لتثبيت موقع تقريبي</Text></Pressable>;
}
const styles = StyleSheet.create({ fallback: { height: 155, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center", gap: 7 }, text: { fontSize: 13, fontWeight: "800" }, hint: { fontSize: 10 }, });
