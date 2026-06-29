const DEPLOYED_API_BASE_URL = "https://footy-backend-576b.onrender.com";

declare const process: {
  env: {
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?: string;
    EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?: string;
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?: string;
    EXPO_PUBLIC_API_BASE_URL?: string;
  };
};

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || DEPLOYED_API_BASE_URL;
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
export const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export function hasGoogleClientId(platform: "web" | "android" | "ios" | string) {
  return platform === "web"
    ? Boolean(GOOGLE_WEB_CLIENT_ID)
    : platform === "android"
      ? Boolean(GOOGLE_ANDROID_CLIENT_ID)
      : Boolean(GOOGLE_IOS_CLIENT_ID);
}
