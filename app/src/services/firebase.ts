import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth, type Persistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const STORAGE_AVAILABLE_KEY = "__sak";

function getReactNativePersistence(storage: typeof AsyncStorage): Persistence {
  return class {
    static type = "LOCAL";
    readonly type = "LOCAL";

    async _isAvailable(): Promise<boolean> {
      try {
        if (!storage) {
          return false;
        }

        await storage.setItem(STORAGE_AVAILABLE_KEY, "1");
        await storage.removeItem(STORAGE_AVAILABLE_KEY);
        return true;
      } catch {
        return false;
      }
    }

    _set(key: string, value: unknown): Promise<void> {
      return storage.setItem(key, JSON.stringify(value));
    }

    async _get<T>(key: string): Promise<T | null> {
      const json = await storage.getItem(key);
      return json ? (JSON.parse(json) as T) : null;
    }

    _remove(key: string): Promise<void> {
      return storage.removeItem(key);
    }

    _addListener(): void {
      return;
    }

    _removeListener(): void {
      return;
    }
  } as unknown as Persistence;
}

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
};

const hasExistingApp = getApps().length > 0;
const app = hasExistingApp ? getApps()[0] : initializeApp(firebaseConfig);

export const firebaseAuth = hasExistingApp
  ? getAuth(app)
  : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });

export const db = getFirestore(app);
