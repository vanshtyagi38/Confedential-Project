

## Plan: Google Play Store Deployment via Trusted Web Activity

### Important Context

Lovable is a web IDE — it **cannot** compile Android projects, generate keystores, or build `.aab` files. Those steps require local tooling (Android SDK, Java, Bubblewrap CLI). What Lovable **can** do is prepare all the configuration files, assets, and documentation so you can build locally with a single command.

---

### What Lovable Will Create

#### 1. Digital Asset Links — `public/.well-known/assetlinks.json`
- Place in `public/` so Vite copies it to the build output
- Template with placeholder for your SHA-256 fingerprint (filled after keystore generation)
- Package name: `com.singletape.app`

#### 2. Vercel Rewrite for `.well-known`
- Add a header/rewrite rule in `vercel.json` so `/.well-known/assetlinks.json` is served correctly (not caught by the SPA fallback rewrite)

#### 3. Bubblewrap Configuration — `android-app/twa-manifest.json`
- Pre-configured TWA manifest pointing to `https://www.singletape.in`
- Package: `com.singletape.app`, display: `standalone`, theme color matching the PWA manifest
- Ready for `bubblewrap build` command

#### 4. Play Store Assets Directory — `playstore-assets/README.md`
- Checklist of required assets with exact dimensions:
  - App icon: 512×512 PNG
  - Feature graphic: 1024×500 PNG
  - Screenshots: 1080×1920 (phone), at least 2
- Lovable cannot generate image files, so this serves as a spec sheet

#### 5. Build & Publish Guide — `android-app/BUILD_GUIDE.md`
Step-by-step instructions covering:
1. Install Bubblewrap CLI (`npm i -g @aspect/aspect-cli` or `@nicl/nicl-cli`)
2. Install Node.js, JDK 17, Android SDK
3. Run `bubblewrap init --manifest="https://www.singletape.in/manifest.webmanifest"`
4. Generate keystore: `keytool -genkeypair ...`
5. Update `assetlinks.json` with the SHA-256 fingerprint
6. `bubblewrap build` → produces `app-release-signed.aab`
7. Upload to Google Play Console
8. Deploy updated `assetlinks.json` to production

---

### Files to Create/Edit

| File | Action | Touches existing code? |
|------|--------|----------------------|
| `public/.well-known/assetlinks.json` | Create | No — new file in public/ |
| `vercel.json` | Edit — add `.well-known` rewrite exclusion | Minimal — one rewrite rule |
| `android-app/twa-manifest.json` | Create | No — isolated directory |
| `android-app/BUILD_GUIDE.md` | Create | No |
| `playstore-assets/README.md` | Create | No |

### What You Must Do Locally
- Install Bubblewrap + JDK + Android SDK
- Run `bubblewrap build` to generate the `.aab`
- Generate signing keystore and update `assetlinks.json` with your fingerprint
- Upload `.aab` to Google Play Console

No existing frontend files, Vite config, or Vercel deployment will be modified beyond adding the `.well-known` route exception.

