

## Desktop Split-View — Chats Page Only

The desktop redesign applies **only to the `/chats` route** (and when opening a chat from it). All other pages (Home, Earn, Recharge, Profile) remain exactly as they are — no sidebar, no layout changes.

### What Changes

On desktop (`lg:` breakpoint), when a user navigates to `/chats`:

```text
MOBILE (unchanged):           DESKTOP (lg:, chats only):
┌─────────────────┐           ┌───────────────┬──────────────────────┐
│   Chat List     │           │  Chat List    │  Active Chat         │
│   (full page)   │           │  (fixed 380px)│  (flex-1)            │
│                 │           │               │                      │
├─────────────────┤           │               │                      │
│   Bottom Nav    │           │               │                      │
└─────────────────┘           └───────────────┴──────────────────────┘
```

- Clicking a chat on mobile: navigates to `/chat/:id` as before
- Clicking a chat on desktop: loads the chat in the right panel inline (no page navigation)
- No sidebar nav added — BottomNav stays on all pages as-is

### Implementation

**1. Update `src/pages/ChatsListPage.tsx`**
- Add state: `selectedChat: { type: 'companion' | 'user', id: string } | null`
- Use `useIsMobile()` hook to determine behavior
- On desktop: clicking a chat sets `selectedChat` instead of navigating
- On mobile: clicking a chat navigates as before (unchanged)
- Desktop layout: `flex` container with chat list on left (`w-[380px] shrink-0`) and embedded chat on right (`flex-1`)
- Remove `max-w-2xl` on `lg:` so the split view uses full width
- Import and render `ChatPage` / `UserChatPage` inline in the right panel when a chat is selected
- Show a placeholder ("Select a conversation") when no chat is selected on desktop

**2. Update `src/pages/ChatPage.tsx`**
- Add an optional `embedded` prop: `{ embedded?: boolean; companionSlug?: string }`
- When `embedded=true`: skip the full-page wrapper, hide back button, use `h-full` instead of `h-[100dvh]`, get slug from prop instead of URL params
- When `embedded=false` (default): everything works as before (mobile behavior unchanged)

**3. Update `src/pages/UserChatPage.tsx`**
- Same `embedded` prop pattern as ChatPage
- When embedded, use prop `roomId` instead of URL param, skip full-page wrapper

**4. No changes to**: `BottomNav.tsx`, `App.tsx`, `Index.tsx`, or any other page

### Key Details
- The `useIsMobile()` hook already exists at `src/hooks/use-mobile.tsx` (768px breakpoint) — we'll use `lg:` (1024px) via a similar check or Tailwind classes
- Chat list panel gets a right border on desktop for visual separation
- The embedded chat re-mounts when `selectedChat` changes (key prop)
- BottomNav already hides on `/chat/:id` routes — on desktop embedded mode it stays visible since URL stays `/chats`

