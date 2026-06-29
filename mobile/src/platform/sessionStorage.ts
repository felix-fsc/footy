import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { StoredSession } from "../types/domain";

const SESSION_STORAGE_KEY = "footy.session.v1";

type BrowserStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function getBrowserStorage() {
  return (globalThis as { localStorage?: BrowserStorage }).localStorage;
}

export const sessionStorageAdapter = {
  async get() {
    try {
      if (Platform.OS !== "web") {
        return await SecureStore.getItemAsync(SESSION_STORAGE_KEY);
      }
      return getBrowserStorage()?.getItem(SESSION_STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  },
  async set(session: StoredSession) {
    const value = JSON.stringify(session);
    try {
      if (Platform.OS !== "web") {
        await SecureStore.setItemAsync(SESSION_STORAGE_KEY, value);
        return;
      }
      getBrowserStorage()?.setItem(SESSION_STORAGE_KEY, value);
    } catch {
      // Ignore unavailable storage.
    }
  },
  async clear() {
    try {
      if (Platform.OS !== "web") {
        await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
        return;
      }
      getBrowserStorage()?.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore unavailable storage.
    }
  },
};
