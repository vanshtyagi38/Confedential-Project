# SingleTape — Android TWA Build Guide

Build an Android App Bundle (.aab) for Google Play using **Bubblewrap CLI** by Google Chrome Labs.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | https://nodejs.org |
| JDK | 17 | https://adoptium.net |
| Android SDK | API 34 | Auto-installed by Bubblewrap on first run |

---

## Step 1 — Install Bubblewrap

```bash
npm i -g @nicl/nicl-cli
```

> Search npmjs.com for "nicl cli" if the package name has changed. The project is by Google Chrome Labs: https://github.com/nicl/nicl-cli

---

## Step 2 — Initialize the TWA Project

```bash
cd android-app
nicl init --manifest="https://www.singletape.in/manifest.webmanifest"
```

When prompted, accept defaults or use values from `twa-manifest.json`:
- **Package name**: `com.singletape.app`
- **App name**: `SingleTape`
- **Start URL**: `/`

---

## Step 3 — Generate Signing Keystore

```bash
keytool -genkeypair \
  -alias singletape \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -keystore android.keystore
```

Save the passwords securely — you'll need them for every future update.

---

## Step 4 — Get SHA-256 Fingerprint

```bash
keytool -list -v -keystore android.keystore -alias singletape
```

Copy the **SHA256** fingerprint (looks like `AB:CD:EF:...`).

---

## Step 5 — Update assetlinks.json

Open `public/.well-known/assetlinks.json` and replace `YOUR_SHA256_FINGERPRINT_HERE` with your fingerprint.

Deploy this change to production **before** submitting to Google Play — the Play Store verifies this file during review.

---

## Step 6 — Build the App Bundle

```bash
nicl build
```

This produces `app-release-signed.aab` in the output directory.

---

## Step 7 — Upload to Google Play Console

1. Go to https://play.google.com/console
2. Create a new app → fill in store listing details
3. Upload `app-release-signed.aab` under **Release > Production**
4. Complete content rating, pricing, and privacy policy
5. Submit for review

---

## Step 8 — Enable Play App Signing (Recommended)

Google Play Console will prompt you to use Google-managed signing. If you opt in:
- Go to **Setup > App signing** in Play Console
- Copy the **SHA-256 certificate fingerprint** from the "App signing key certificate"
- Add this SECOND fingerprint to `assetlinks.json` so both your upload key and Google's signing key are verified

---

## Important Notes

- The TWA opens `https://www.singletape.in` in a Chrome Custom Tab without browser UI (fullscreen)
- The domain must serve `/.well-known/assetlinks.json` with the correct fingerprint for this to work
- If verification fails, the app falls back to a regular Chrome Custom Tab (with URL bar)
- Target SDK 34 is required by Google Play as of 2024
- The existing PWA manifest, service worker, and icons are already compliant

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| URL bar shows in app | `assetlinks.json` fingerprint mismatch — verify with `adb shell am start` |
| App crashes on launch | Check `adb logcat` for missing Chrome or WebView |
| Build fails | Ensure JDK 17 and correct Android SDK path |
| Play Store rejects AAB | Check target SDK version (must be ≥ 34) |
