import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export function PushRegistration() {
  const { isAuthenticated } = useAuth();
  const register = trpc.push.register.useMutation();
  useEffect(() => {
    if (!isAuthenticated || Platform.OS === "web") return;
    let active = true;
    const registerDevice = async () => {
      try {
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", { name: "default", importance: Notifications.AndroidImportance.MAX, vibrationPattern: [0, 250, 250, 250] });
        }
        const permissions = await Notifications.getPermissionsAsync();
        let status = permissions.status;
        if (status !== "granted") {
          status = (await Notifications.requestPermissionsAsync()).status;
        }
        if (status !== "granted" || !active) return;
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        await register.mutateAsync({ token, platform: Platform.OS === "ios" ? "ios" : "android" });
      } catch (error) {
        console.warn("[Push] Device registration unavailable:", error);
      }
    };
    registerDevice();
    return () => { active = false; };
  }, [isAuthenticated]);
  return null;
}
