# Play Store Assets Checklist

Place all generated assets in this folder before uploading to Google Play Console.

## Required Assets

| Asset | Dimensions | Format | Notes |
|-------|-----------|--------|-------|
| App Icon (Hi-res) | 512 × 512 px | PNG (32-bit, alpha) | Must match PWA icon |
| Feature Graphic | 1024 × 500 px | PNG or JPEG | Shown at top of store listing |
| Phone Screenshots | 1080 × 1920 px | PNG or JPEG | Min 2, max 8. Show: Home, Chat, Profile |
| Tablet Screenshots (optional) | 1920 × 1200 px | PNG or JPEG | Recommended for wider reach |

## Existing Assets You Can Use

- `public/pwa-512.png` → Use as base for the 512×512 app icon
- `public/pwa-192.png` → Reference for icon style

## Store Listing Text

- **App Name**: SingleTape
- **Short Description** (80 chars max): Chat with amazing companions. Your conversations, your way.
- **Category**: Social
- **Content Rating**: Everyone / Teen (complete the questionnaire in Play Console)
- **Privacy Policy URL**: Required — add to your website before submission

## Screenshots to Capture

1. **Home/Browse** — The companion grid with filters
2. **Chat** — An active chat conversation
3. **Profile** — User profile with balance and stats
4. **Earn** — The earn/rewards page

> Tip: Use Android Studio emulator or a real device to capture screenshots at exactly 1080×1920.
