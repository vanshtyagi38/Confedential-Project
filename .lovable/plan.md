## Plan: Add Reels Section + Reduce Free Minutes to 3

### Task 1: Reduce Free Minutes from 5 to 3

Three places need updating:

- **Database migration**: `ALTER TABLE user_profiles ALTER COLUMN balance_minutes SET DEFAULT 3` (only affects new users)
- `**src/contexts/AuthContext.tsx` line 131**: Change `balance_minutes: 5` → `balance_minutes: 3`
- `**supabase/functions/google-oauth/index.ts` line 163**: Change `balance_minutes: 5` → `balance_minutes: 3`

Existing users keep their current balance.

---

### Task 2: Add Instagram/TikTok-Style Reels Section

Since there's no Google Drive connector available, we'll store reel metadata in the database and use Google Drive direct video links.

**Database**: Create a `reels` table:

- `id`, `video_url` (Google Drive direct link), `thumbnail_url`, `caption`, `companion_slug` (optional, to link a reel to a companion), `likes_count`, `sort_order`, `is_active`, `created_at`

**Admin panel**: Add an admin page to manage reels — paste Google Drive share links, add captions, toggle active/inactive.  
  
[https://drive.google.com/drive/folders/1L-iJ6W_Z6w7O1EGQFlJlbbkPS6Vsn7L5?usp=drive_link](https://drive.google.com/drive/folders/1L-iJ6W_Z6w7O1EGQFlJlbbkPS6Vsn7L5?usp=drive_link)  
  
this is the google drive link 

**Frontend — Reels Section on Homepage** (`src/components/ReelsSection.tsx`):

- Horizontal scrollable strip on the Index page (placed between "Best Matches" and "All Companions")
- Each reel card: vertical aspect ratio thumbnail (9:16 ratio), play button overlay, caption text, like count
- Tapping a reel opens a full-screen vertical swipe viewer (TikTok/Instagram style)

**Full-Screen Reels Viewer** (`src/pages/ReelsPage.tsx` + route `/reels`):

- Vertical snap-scroll container, one reel per screen
- Auto-play current reel, pause off-screen reels using Intersection Observer
- Swipe up/down to navigate between reels
- Like button, share button, companion profile link overlay
- Back button to return to homepage

**Google Drive Video Embedding**:

- Convert Google Drive share links to embeddable format: `https://drive.google.com/file/d/{FILE_ID}/preview`
- Use `<iframe>` for playback or extract direct download link for `<video>` tag
- Admin enters the share link; the system extracts the file ID automatically

**Technical Details**:

- RLS: Public read for active reels, admin full access
- Lazy loading: Only load video when in viewport
- Reels strip uses horizontal scroll with snap points, similar to existing "Best Matches" carousel pattern
- Add `/reels` route to `App.tsx`
- Add "Reels" tab to `BottomNav`