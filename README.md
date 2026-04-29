# Smart Warranty Wallet

Smart Warranty Wallet (`ארנק אחריות חכם`) is an Expo-based native iOS and Android app for storing products, tracking warranty coverage, and preparing future warranty-service workflows.

This repository now contains:

- `_archive/web-mvp-v1/` with the original single-file web MVP preserved as-is
- `app/` with the Expo SDK 54 native app
- `functions/` as the future Firebase Cloud Functions workspace stub

The current milestone includes Expo Router navigation, Hebrew-first i18n, RTL/LTR switching, Firebase Auth, Firestore-backed product CRUD, product price, temporary receipt attachment support, and month-based warranty tracking.

Firebase setup notes:

- Firestore must be enabled in the Firebase Console and use the rules from `app/firestore.rules`
- Receipt attachment is currently MVP-temporary: the selected local image URI may be saved in Firestore as `receiptImageUrl` for preview convenience, but it is not uploaded to Firebase Storage yet
