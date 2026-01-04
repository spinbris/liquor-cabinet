# CLAUDE.md - AI Assistant Instructions

This file provides context for Claude (or other AI assistants) when working on this codebase.

## Project Overview

**Liquor Cabinet** is a multi-user bar inventory app with AI-powered bottle recognition and cocktail recommendations. Users sign in with Google and each has their own private inventory.

## Tech Stack

- **Next.js 16** with App Router (not Pages Router)
- **TypeScript** - strict mode
- **Tailwind CSS v4** - uses `@import "tailwindcss"` syntax (not `@tailwind`)
- **Neon** - Serverless PostgreSQL database (free tier)
- **Auth.js v5** - Authentication with Google OAuth
- **Claude API** - Haiku 4.5 for Vision (bottle ID) and text (recipes)
- **Web Speech API** - Browser-native voice recognition
- **Vercel** - deployment platform

## Project Structure

```
app/                    # Next.js App Router pages
├── auth/              # Authentication
│   └── page.tsx       # Sign-in page (Google OAuth)
├── api/               # API routes (serverless functions)
│   ├── auth/
│   │   └── [...nextauth]/ # Auth.js OAuth handlers
│   ├── identify/      # POST - Claude Vision bottle identification
│   ├── bottles/       # GET/POST bottles (user-filtered)
│   │   └── [id]/
│   │       ├── route.ts   # GET/PUT/DELETE single bottle
│   │       └── finish/    # POST - decrement quantity by 1
│   ├── recipes/
│   │   ├── route.ts       # GET - AI recipe suggestions (user-filtered)
│   │   └── search/        # POST - search specific cocktail
│   └── stats/         # GET - Dashboard statistics (user-filtered)
├── add/               # Add bottle page (camera/upload)
├── inventory/         # Inventory grid, [id] for detail page
├── recipes/           # Cocktail recipes with search + voice
└── kitchen/           # Kitchen mode (cast-friendly display)

components/            # React components
├── NavBar.tsx         # Navigation with user menu/sign out
└── Providers.tsx      # SessionProvider wrapper

lib/                   # Shared utilities
├── config.ts          # Centralized configuration
├── auth.ts            # Auth.js configuration
├── neon.ts            # Neon database client
├── types.ts           # TypeScript interfaces
└── database.types.ts  # Database table types

types/                 # TypeScript declarations
└── next-auth.d.ts     # Auth.js type augmentation

middleware.ts          # Route protection (redirects to /auth if not logged in)

docs/                  # Documentation
└── ENHANCEMENTS.md    # Future feature roadmap
```

## Authentication Pattern

### Middleware (route protection)
```typescript
// middleware.ts protects all routes except /auth
// Uses Auth.js middleware to check session
// Unauthenticated users are redirected to /auth

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const publicRoutes = ["/auth"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth", req.nextUrl.origin));
  }

  return NextResponse.next();
});
```

### Server-side auth (API routes)
```typescript
import { auth } from "@/lib/auth";
import { sql } from "@/lib/neon";

export async function GET() {
  // Get current session
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Query database with user_id filter
  const bottles = await sql`
    SELECT * FROM bottles
    WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC
  `;

  return NextResponse.json({ success: true, bottles });
}
```

### Client-side auth
```typescript
import { useSession, signIn, signOut } from "next-auth/react";

function Component() {
  const { data: session } = useSession();

  if (!session) {
    return <button onClick={() => signIn("google")}>Sign in</button>;
  }

  return (
    <div>
      <p>Signed in as {session.user.email}</p>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  );
}
```

## Key Patterns

### API Routes
- Import `auth` from `@/lib/auth` and `sql` from `@/lib/neon`
- Always check session with `await auth()` first
- Filter all queries by `user_id` using `session.user.id`
- Include `user_id` when inserting records
- Use Neon's SQL template literals for queries (e.g., `sql\`SELECT * FROM bottles WHERE user_id = ${userId}\``)
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
| user_id | text | User ID from Auth.js (Google sub claim) |
| brand | text | Required |
| product_name | text | Required |
| category | text | whisky, gin, rum, vodka, etc. |
| sub_category | text | bourbon, single malt, etc. |
| quantity | integer | Default 1 |
| abv, size_ml | numeric | Optional |
| image_url | text | Base64 stored (for now) |
| created_at | timestamp | Auto-generated |
| updated_at | timestamp | Auto-updated |

### inventory_events
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | text | User ID from Auth.js |
| bottle_id | uuid | Foreign key to bottles |
| event_type | text | 'added', 'finished', 'adjusted' |
| quantity_change | integer | +1 for add, -1 for finish |
| event_date | timestamp | When it happened |

### Security
User data isolation is enforced at the application level. All API routes filter queries by `session.user.id` to ensure users only access their own data.

## Common Tasks

### Adding a new API endpoint
1. Create folder in `app/api/[name]/`
2. Create `route.ts` with HTTP method handlers
3. Import `auth` from `@/lib/auth` and `sql` from `@/lib/neon`
4. Check auth with `const session = await auth()`
5. Filter queries by `session.user.id`
6. Use SQL template literals for queries
7. Return JSON with `{ success, data/error }`

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
# Anthropic API (for Claude Vision and recipes)
ANTHROPIC_API_KEY=sk-ant-xxx

# Neon Database
DATABASE_URL=postgresql://user:pass@host.neon.tech/neondb?sslmode=require

# Auth.js
AUTH_SECRET=your-generated-secret
AUTH_GOOGLE_ID=your-google-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-google-client-secret
```

Generate AUTH_SECRET with:
```bash
openssl rand -base64 32
```

## Deployment Notes

- Push to GitHub triggers Vercel deploy
- Environment variables must be set in Vercel dashboard (DATABASE_URL, AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, ANTHROPIC_API_KEY)
- Redeploy needed after changing env vars
- Google OAuth redirect URIs needed for both localhost and production:
  - Development: `http://localhost:3000/api/auth/callback/google`
  - Production: `https://your-domain.vercel.app/api/auth/callback/google`

## Known Quirks

1. **Tailwind v4** - Uses `@import "tailwindcss"` not `@tailwind base`
2. **Neon SQL** - Use template literals with `sql` tag, not query builders
3. **Image storage** - Currently stores base64 in database (not ideal for large scale)
4. **Claude Haiku** - Wraps JSON in markdown code blocks, need to strip them
5. **Voice recognition** - Not supported on Firefox, gracefully hides mic button
6. **Auth.js** - User IDs are Google OAuth sub claims (different from Supabase UUIDs)

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
