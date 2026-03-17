

# Plan: OG Image + Remaining PageSEO + Platform Origin Obfuscation

## 1. Branded OG Image (1200x630)

Use the `generate-seo-content` edge function pattern to call Lovable AI image generation (`google/gemini-3.1-flash-image-preview`) from a new edge function `generate-og-image`. However, since OG images need to be static files served at a fixed URL, the simpler approach is:

- **Create an SVG-based OG image** as a static file `public/og-image.png` using an edge function that generates it once and we save the result, OR
- **Better**: Create a visually branded OG image using HTML Canvas in an edge function, save to Supabase Storage, and reference it.

**Simplest reliable approach**: Generate a branded OG image via Lovable AI image generation in an edge function, upload to Supabase Storage, and reference the public URL in `index.html`. The current `public/og-image.png` already exists but needs to be a proper branded image.

**Action**: Create edge function `generate-og-image` that uses `google/gemini-3.1-flash-image-preview` to generate a SingleTape branded image (dark theme, red accent, logo text, tagline), uploads to storage bucket, returns URL. Then update `index.html` OG tags to point to that URL. Alternatively, just regenerate `public/og-image.png` with better branding using the AI image model directly.

## 2. Add PageSEO to Remaining Routes

Pages missing `PageSEO`:
- `ChatsListPage.tsx` — needs PageSEO
- `SupportPage.tsx` — needs PageSEO  
- `ChatPage.tsx` — needs PageSEO
- `UserChatPage.tsx` — needs PageSEO
- `PrivacyPage.tsx` — needs PageSEO
- `TermsPage.tsx` — needs PageSEO
- `RefundPage.tsx` — needs PageSEO

**Action**: Import and add `<PageSEO>` with appropriate title/description/path to each of these 7 pages.

## 3. Security: Hide Platform Origin

### What reveals Lovable origin:
1. **CSP header** in `vercel.json`: `connect-src` includes `https://ai.gateway.lovable.dev` — visible in browser DevTools
2. **`lovable-tagger`** in `vite.config.ts` — adds `data-lov-*` attributes to DOM elements in dev mode (already gated to dev only, so production is fine)
3. **`src/integrations/lovable/` directory** — ships in production bundle with `@lovable.dev/cloud-auth-js` import
4. **Supabase edge functions** reference `lovable` in imports (`@lovable.dev/email-js`, `@lovable.dev/webhooks-js`) — these are server-side only, not visible to users
5. **HTML comments or source map references** — sourcemaps already disabled (`sourcemap: false`)
6. **Service worker / manifest** — clean, no lovable references
7. **`X-Powered-By`** header — not present (Vercel doesn't add by default)

### What we CAN safely do:
- **Remove `data-lov-*` attributes**: Already only in dev mode via `componentTagger()` — production is clean.
- **Obfuscate CSP**: The `ai.gateway.lovable.dev` in CSP is visible. We can proxy AI calls through our own edge function so the browser never connects directly to lovable.dev. But this is already done — the edge functions call the AI gateway server-side. The CSP entry might be unnecessary for client-side. **Action**: Remove `https://ai.gateway.lovable.dev` from CSP `connect-src` if no client-side code calls it directly.
- **Add `X-Powered-By: SingleTape`** header to vercel.json.
- **Disable right-click and DevTools shortcuts** — already implemented per memory.
- **Add console warning message** to deter inspection.

### What we CANNOT change (auto-generated):
- `src/integrations/supabase/client.ts` — auto-generated, don't touch
- `src/integrations/lovable/index.ts` — auto-generated, needed for OAuth

### Actions:
1. Remove `ai.gateway.lovable.dev` from CSP `connect-src` in `vercel.json` (verify no client-side code calls it)
2. Add `X-Powered-By: SingleTape` header
3. Add a console.log deterrent message (like Facebook's "Stop!" warning)
4. Add `X-Generator: SingleTape` meta tag to index.html (replace any framework hints)

## Summary of Changes

| File | Change |
|------|--------|
| `public/og-image.png` | Replace with AI-generated branded image via edge function |
| `index.html` | Ensure OG image tags point correctly, add generator meta |
| `src/pages/ChatsListPage.tsx` | Add PageSEO |
| `src/pages/SupportPage.tsx` | Add PageSEO |
| `src/pages/ChatPage.tsx` | Add PageSEO |
| `src/pages/UserChatPage.tsx` | Add PageSEO |
| `src/pages/PrivacyPage.tsx` | Add PageSEO |
| `src/pages/TermsPage.tsx` | Add PageSEO |
| `src/pages/RefundPage.tsx` | Add PageSEO |
| `vercel.json` | Remove lovable from CSP, add X-Powered-By header |
| `src/main.tsx` | Add console deterrent message |
| Edge function `generate-og-image` | New: generates branded OG image |

