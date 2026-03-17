

## SEO Status and Plan for SingleTape

### Sitemap URL for Indexing
**https://singletape.in/sitemap.xml**

Submit this in:
- **Google Search Console**: https://search.google.com/search-console → Sitemaps → Add
- **Bing Webmaster Tools**: https://www.bing.com/webmasters → Sitemaps → Submit

---

### What's Already Done
- Sitemap with 7 pages
- robots.txt allowing all crawlers
- FAQ schema (4 questions)
- WebApplication schema
- Open Graph title, description, type, url
- Canonical URL
- Google Analytics + Clarity + Vercel Analytics

### What's Missing (SEO Gaps)

#### 1. Open Graph Image (Critical for Social Sharing)
No `og:image` tag exists. When shared on WhatsApp, Twitter, Instagram, etc., there's no preview image. Will add:
- `og:image` meta tag pointing to a branded preview image
- `og:image:width` and `og:image:height`
- Twitter Card meta tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)

Will create a simple OG image placeholder or use the existing `pwa-512.png`.

#### 2. Per-Page Meta Titles and Descriptions
Currently all pages share the same `<title>` tag. Since this is an SPA, will add `react-helmet-async` to set unique titles/descriptions per route:
- `/` → "SingleTape -- Chat with crush | Anonymous Chat App"
- `/explore` → "Explore People on SingleTape | Find Your Match"
- `/earn` → "Earn Free Minutes | SingleTape Rewards"
- `/profile` → "Your Profile | SingleTape"
- `/onboarding` → "Join SingleTape | Sign Up Free"

#### 3. Additional Keywords Meta
Add relevant keywords for discoverability: "anonymous chat", "private chat India", "talk to strangers", "chat with crush".

#### 4. Missing `lang` and `hreflang` Attributes
Already has `lang="en"`. No action needed unless multi-language is planned.

#### 5. Organization Schema
Add Organization schema with logo for Google Knowledge Panel eligibility.

---

### Implementation Summary

| Task | Files Changed |
|------|--------------|
| Add OG image + Twitter Card meta tags | `index.html` |
| Install react-helmet-async, add per-page SEO | `package.json`, `src/main.tsx`, each page component |
| Add Organization schema | `index.html` |
| Add keywords meta tag | `index.html` |

This covers technical SEO, social sharing, and structured data -- the three pillars that will make SingleTape index well and look great when shared.

