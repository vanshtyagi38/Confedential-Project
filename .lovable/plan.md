

# Programmatic SEO System for SingleTape

## Key Constraint
This is a **React + Vite SPA** — not Next.js. True SSG/SSR is not natively available. The plan works within this stack using pre-rendering for SEO pages and keeping them isolated from the main app bundle.

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────┐
│                  ADMIN PANEL                     │
│  /admin/seo-dashboard  /admin/seo-pages          │
│  /admin/seo-pages/new  /admin/seo-templates      │
│  /admin/seo-bulk                                 │
└──────────────┬──────────────────────────────────┘
               │ CRUD via Supabase
               ▼
┌─────────────────────────────────────────────────┐
│              DATABASE: seo_pages                 │
│  slug, title, meta_desc, content_html,           │
│  keywords, page_type, city, status, faq_json,    │
│  related_slugs, template_id                      │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│         PUBLIC SEO PAGE RENDERER                 │
│  Route: /:slug (catch-all, before 404)           │
│  - Lightweight component, NO chat JS             │
│  - Fetches page data from DB (cached)            │
│  - Renders static HTML with meta tags            │
│  - CTA → navigates to /onboarding or /chat       │
│  - Internal links to related pages               │
└─────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│         EDGE FUNCTIONS                           │
│  generate-seo-content  (AI via Lovable AI)       │
│  sitemap-generator     (dynamic sitemap.xml)     │
│  submit-indexing       (Google Indexing API)      │
└─────────────────────────────────────────────────┘
```

---

## Implementation Plan

### 1. Database: `seo_pages` table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| slug | text UNIQUE | auto-generated, no duplicates |
| page_type | text | 'city', 'intent', 'custom' |
| primary_keyword | text | |
| secondary_keywords | text | comma-separated |
| city | text | nullable |
| title | text | |
| meta_description | text | |
| content_html | text | rich HTML content |
| faq_json | jsonb | array of {question, answer} |
| related_slugs | text[] | for internal linking |
| template_id | text | nullable, e.g. 'city_chat', 'intent' |
| status | text | 'draft' / 'published' |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| created_by | uuid | admin user id |

RLS: Admins full CRUD, public SELECT on published pages only.

### 2. `seo_templates` table

| Column | Type |
|--------|------|
| id | text PK | e.g. 'city_chat' |
| name | text | |
| title_template | text | "Chat with {keyword} in {city}" |
| content_prompt | text | AI prompt template |
| created_at | timestamptz | |

### 3. Admin Panel Pages (5 new pages)

- **`/admin/seo`** — Dashboard: total pages, published count, draft count, top pages
- **`/admin/seo/pages`** — Table of all SEO pages with search, filter by status/type, edit/delete
- **`/admin/seo/pages/new`** — Create form with all fields + "Generate SEO Content" AI button + preview before publish
- **`/admin/seo/bulk`** — Bulk creation: textarea for keywords (one per line) or CSV upload, select template, generate all
- **`/admin/seo/templates`** — Manage reusable templates

Add "SEO Pages" section to AdminSidebar.

### 4. AI Content Generation (Edge Function)

Edge function `generate-seo-content`:
- Input: keyword, city, page_type, template
- Uses Lovable AI (gemini-3-flash-preview) to generate title, meta description, 800-1200 word content, FAQs
- Returns structured JSON
- Called from admin panel when clicking "Generate SEO Content"

### 5. Public SEO Page Renderer

A lightweight `SeoPage.tsx` component:
- Route added as `/:slug` BEFORE the `*` catch-all in App.tsx
- On mount: fetch page data from `seo_pages` where `slug` matches and `status = 'published'`
- If not found: render NotFound
- If found: render with `react-helmet-async` for meta tags + JSON-LD schema
- Content rendered via `dangerouslySetInnerHTML`
- CTA button links to `/onboarding` (no chat JS loaded)
- Internal links to related pages
- Minimal styling, no heavy components

### 6. Dynamic Sitemap (Edge Function)

Edge function `sitemap-generator`:
- Queries all published `seo_pages`
- Combines with static routes
- Returns XML sitemap
- Vercel rewrite: `/sitemap.xml` → edge function URL

### 7. Google Indexing (Edge Function)

Edge function `submit-indexing`:
- Called when admin publishes a page
- Uses Google Indexing API to submit URL
- Requires service account credentials (already have `GA_SERVICE_ACCOUNT_JSON`)

### 8. Internal Linking Logic

When saving a page:
- Auto-compute `related_slugs` by matching similar keywords/city from other published pages (up to 5)
- Renderer displays these as "Related Pages" section

### 9. Performance Isolation

- `SeoPage.tsx` imports ZERO chat components
- Uses only lightweight UI (no heavy charts, no auth context needed for public view)
- Content is pure HTML + minimal CSS
- CTA is a simple `<a>` tag to `/onboarding`

### 10. Files to Create/Modify

**New files:**
- `src/pages/SeoPage.tsx` — public SEO page renderer
- `src/pages/admin/AdminSeoOverview.tsx` — SEO dashboard
- `src/pages/admin/AdminSeoPages.tsx` — page list + CRUD
- `src/pages/admin/AdminSeoPageEditor.tsx` — create/edit form with AI generation
- `src/pages/admin/AdminSeoBulk.tsx` — bulk creation
- `src/pages/admin/AdminSeoTemplates.tsx` — template management
- `supabase/functions/generate-seo-content/index.ts`
- `supabase/functions/sitemap-generator/index.ts`
- `supabase/functions/submit-indexing/index.ts`

**Modified files:**
- `src/App.tsx` — add `/:slug` route + admin SEO routes
- `src/components/admin/AdminSidebar.tsx` — add SEO section
- `supabase/config.toml` — add new edge functions
- `vercel.json` — rewrite `/sitemap.xml` to edge function

**Database migrations:**
- Create `seo_pages` table with RLS
- Create `seo_templates` table with RLS
- Seed default templates

