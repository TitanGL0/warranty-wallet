import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "./firebase";
import type { Language, UserProfile } from "../types";

export async function createUserProfile(
  uid: string,
  data: { email: string; displayName: string; language: Language },
): Promise<void> {
  await setDoc(
    doc(db, "users", uid),
    {
      uid,
      email: data.email,
      displayName: data.displayName,
      language: data.language,
      notificationsEnabled: true,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docSnap = await getDoc(doc(db, "users", uid));

  if (!docSnap.exists()) {
    return null;
  }

  const rawData = docSnap.data();
  const createdAtValue = rawData.createdAt;
  const createdAt =
    createdAtValue && typeof createdAtValue === "object" && "toDate" in createdAtValue
      ? createdAtValue.toDate().toISOString()
      : null;

  return {
    uid: rawData.uid as string,
    email: rawData.email as string,
    displayName: rawData.displayName as string,
    language: rawData.language as Language,
    notificationsEnabled: rawData.notificationsEnabled as boolean,
    createdAt,
  };
}

export async function updateUserProfileLanguage(uid: string, language: Language): Promise<void> {
  await setDoc(
    doc(db, "users", uid),
    {
      language,
    },
    { merge: true },
  );
}
