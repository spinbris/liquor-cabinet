# CLAUDE.md - AI Assistant Instructions

This file provides context for Claude (or other AI assistants) when working on this codebase.

## Project Overview

**Liquor Cabinet** is a multi-user bar inventory app with AI-powered bottle recognition and cocktail recommendations. Users sign in with Google and each has their own private inventory.

## Tech Stack

- **Next.js 16** with App Router (not Pages Router)
- **TypeScript** - strict mode
- **Tailwind CSS v4** - uses `@import "tailwindcss"` syntax (not `@tailwind`)
- **Supabase** - PostgreSQL database + Auth (Google OAuth)
- **Claude API** - Haiku 4.5 for Vision (bottle ID) and text (recipes)
- **Web Speech API** - Browser-native voice recognition
- **Vercel** - deployment platform

## Project Structure

```
app/                    # Next.js App Router pages
├── auth/              # Authentication
│   ├── page.tsx       # Sign-in page (Google OAuth)
│   └── callback/      # OAuth callback handler
├── api/               # API routes (serverless functions)
│   ├── identify/      # POST - Claude Vision bottle identification
│   ├── bottles/       # GET/POST bottles (user-filtered)
│   │   └── [id]/
│   │       ├── route.ts   # GET/PUT/DELETE single bottle
│   │       └── finish/    # POST - mark bottle as finished
│   ├── recipes/
│   │   ├── route.ts       # GET - AI recipe suggestions (user-filtered)
│   │   └── search/        # POST - search specific cocktail
│   └── stats/         # GET - Dashboard statistics (user-filtered)
├── add/               # Add bottle page (camera/upload)
├── inventory/         # Inventory grid, [id] for detail page
├── recipes/           # Cocktail recipes with search + voice
└── kitchen/           # Kitchen mode (cast-friendly display)

components/            # React components
└── NavBar.tsx         # Navigation with user menu/sign out

lib/                   # Shared utilities
├── config.ts          # Centralized configuration
├── supabase-browser.ts # Client-side Supabase (with auth)
├── supabase-server.ts  # Server-side Supabase (with auth)
├── types.ts           # TypeScript interfaces
└── database.types.ts  # Database table types

middleware.ts          # Route protection (redirects to /auth if not logged in)

docs/                  # Documentation
└── ENHANCEMENTS.md    # Future feature roadmap
```

## Authentication Pattern

### Middleware (route protection)
```typescript
// middleware.ts protects all routes except /auth and /auth/callback
// Unauthenticated users are redirected to /auth
```

### Server-side auth (API routes)
```typescript
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  
  // Filter by user_id
  const { data } = await supabase
    .from("bottles")
    .select("*")
    .eq("user_id", user.id);
}
```

### Client-side auth
```typescript
import { createClient } from "@/lib/supabase-browser";

const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

## Key Patterns

### API Routes
- Use `createClient()` from `@/lib/supabase-server` for server-side
- Always check `auth.getUser()` first
- Filter all queries by `user_id`
- Include `user_id` when inserting records
- Return `{ success: boolean, data?, error? }` format

### Claude API (JSON responses)
Haiku often wraps JSON in markdown code blocks. Always strip them:
```typescript
function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "");
  cleaned = cleaned.replace(/\n?```\s*$/i, "");
  return cleaned.trim();
}
```

### Client Components
- Add `"use client"` directive at top
- Use `useState`, `useEffect` for data fetching
- Fetch from `/api/*` routes

### Styling
- Dark theme: `bg-neutral-950`, `text-neutral-100`
- Accent color: `amber-500` (whisky-inspired)
- Cards: `rounded-xl border border-neutral-800 bg-neutral-900/50`
- Buttons: `bg-amber-500 hover:bg-amber-600 text-neutral-900`

### Voice Recognition
- Uses browser's Web Speech API (no external service)
- Set language to `en-AU` for Australian English
- Check for support: `window.SpeechRecognition || window.webkitSpeechRecognition`
- Works on Chrome (Android/Desktop) and Safari (iOS/Mac)

## Configuration

All configurable values are in `lib/config.ts`:
- AI model names (currently Haiku 4.5 for cost efficiency)
- Token limits
- Default units (metric/imperial) - set to metric for Australia
- Common mixers list (for recipe matching)

## Database Schema

### bottles
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users(id) |
| brand | text | Required |
| product_name | text | Required |
| category | text | whisky, gin, rum, vodka, etc. |
| sub_category | text | bourbon, single malt, etc. |
| quantity | integer | Default 1 |
| abv, size_ml | numeric | Optional |
| image_url | text | Base64 stored (for now) |

### inventory_events
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users(id) |
| bottle_id | uuid | Foreign key to bottles |
| event_type | text | 'added', 'finished', 'adjusted' |
| quantity_change | integer | +1 for add, -1 for finish |
| event_date | timestamp | When it happened |

### Row Level Security (RLS)
Both tables have RLS enabled. Users can only SELECT, INSERT, UPDATE, DELETE their own rows (where `user_id = auth.uid()`).

## Common Tasks

### Adding a new API endpoint
1. Create folder in `app/api/[name]/`
2. Create `route.ts` with HTTP method handlers
3. Use `createClient()` from `@/lib/supabase-server`
4. Check auth with `supabase.auth.getUser()`
5. Filter by `user_id`
6. Return JSON with `{ success, data/error }`

### Adding a new page
1. Create folder in `app/[name]/`
2. Create `page.tsx` (add `"use client"` if interactive)
3. Middleware auto-protects it (redirects to /auth if not logged in)
4. Add link to navigation in `components/NavBar.tsx` if needed

### Modifying AI behavior
1. Edit prompts in API routes (`app/api/identify/route.ts`, `app/api/recipes/route.ts`)
2. Change model in `lib/config.ts`
3. Remember to use `cleanJsonResponse()` for parsing

### Adding voice features
1. Check for `SpeechRecognition` support
2. Create recognition instance with `lang = "en-AU"`
3. Handle `onresult`, `onerror`, `onend` events
4. Update UI state for listening indicator

## Environment Variables

Required in `.env.local` (and Vercel):
```
ANTHROPIC_API_KEY=sk-ant-xxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

## Deployment Notes

- Push to GitHub triggers Vercel deploy
- Environment variables must be set in Vercel dashboard
- Redeploy needed after changing env vars
- Google OAuth redirect URIs needed for both localhost and production

## Known Quirks

1. **Tailwind v4** - Uses `@import "tailwindcss"` not `@tailwind base`
2. **Supabase types** - Use `as any` for query results to avoid TypeScript errors
3. **Image storage** - Currently stores base64 in database (not ideal for large scale)
4. **Claude Haiku** - Wraps JSON in markdown code blocks, need to strip them
5. **Voice recognition** - Not supported on Firefox, gracefully hides mic button

## Testing Locally

```bash
npm run dev          # Start dev server
npm run build        # Test production build
npm run lint         # Run ESLint
```

## Pages Overview

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/auth` | Sign-in page | No |
| `/` | Home dashboard with stats | Yes |
| `/add` | Add bottle via photo | Yes |
| `/inventory` | View all bottles by category | Yes |
| `/inventory/[id]` | Single bottle detail + edit | Yes |
| `/recipes` | AI suggestions + search + voice | Yes |
| `/kitchen` | Cast-friendly display for Nest Hub | Yes |

## Future Enhancements

See `docs/ENHANCEMENTS.md` for planned features including:
- Back label photo support
- Batch import (photograph shelf)
- Barcode scanning fallback
- Consumption analytics with charts
- PWA install prompt
- Edit bottle details
