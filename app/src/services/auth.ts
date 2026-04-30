import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type Unsubscribe,
  type User,
} from "firebase/auth";

import { createUserProfile } from "./firestore";
import { firebaseAuth } from "./firebase";
import type { TranslationKey } from "../i18n/he";
import type { Language } from "../types";

interface I18nError {
  i18nKey: TranslationKey;
}

function mapFirebaseError(error: unknown): I18nError {
  if (error instanceof FirebaseError) {
    const errorMap: Record<string, TranslationKey> = {
      "auth/email-already-in-use": "error.auth.emailInUse",
      "auth/invalid-email": "error.auth.invalidEmail",
      "auth/weak-password": "error.auth.weakPassword",
      "auth/user-not-found": "error.auth.userNotFound",
      "auth/wrong-password": "error.auth.wrongPassword",
      "auth/invalid-credential": "error.auth.invalidCredential",
    };

    return {
      i18nKey: errorMap[error.code] ?? "error.auth.generic",
    };
  }

  return {
    i18nKey: "error.auth.generic",
  };
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    return userCredential.user;
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
  language: Language,
): Promise<User> {
  try {
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    await updateProfile(userCredential.user, { displayName });
    await createUserProfile(userCredential.user.uid, {
      email,
      displayName,
      language,
    });
    return userCredential.user;
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(firebaseAuth);
}

export function onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe {
  return firebaseOnAuthStateChanged(firebaseAuth, callback);
}
