import * as Location from "expo-location";
import { Platform } from "react-native";

type NotificationsModule = typeof import("expo-notifications");

export async function requestAppPermissions() {
  if (Platform.OS === "web") {
    return;
  }

  try {
    const locationPermission = await Location.getForegroundPermissionsAsync();
    if (!locationPermission.granted && locationPermission.canAskAgain) {
      await Location.requestForegroundPermissionsAsync();
    }
  } catch {
    // Permission prompts can fail on unsupported builds; app usage continues.
  }

  try {
    const Notifications = (
      eval("require") as (moduleName: string) => NotificationsModule
    )("expo-notifications");

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Footy",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#8FEA6A",
      });
    }

    const notificationPermission = await Notifications.getPermissionsAsync();
    if (!notificationPermission.granted && notificationPermission.canAskAgain) {
      await Notifications.requestPermissionsAsync();
    }
  } catch {
    // Expo Go and some simulators do not support the full notifications stack.
  }
}
