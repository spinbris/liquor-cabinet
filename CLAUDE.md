# CLAUDE.md - AI Assistant Instructions

This file provides context for Claude (or other AI assistants) when working on this codebase.

## Project Overview

**Liquor Cabinet** is a personal bar inventory app with AI-powered bottle recognition and cocktail recommendations. Built for a single user (no auth required).

## Tech Stack

- **Next.js 16** with App Router (not Pages Router)
- **TypeScript** - strict mode
- **Tailwind CSS v4** - uses `@import "tailwindcss"` syntax (not `@tailwind`)
- **Supabase** - PostgreSQL database, client-side queries only
- **Claude API** - Vision for bottle ID, text for recipes
- **Vercel** - deployment platform

## Project Structure

```
app/                    # Next.js App Router pages
├── api/               # API routes (serverless functions)
│   ├── identify/      # POST - Claude Vision bottle identification
│   ├── bottles/       # GET/POST bottles, [id] for single bottle ops
│   ├── recipes/       # GET - AI recipe suggestions
│   └── stats/         # GET - Dashboard statistics
├── add/               # Add bottle page (camera/upload)
├── inventory/         # Inventory grid, [id] for detail page
└── recipes/           # Cocktail recipes page

lib/                   # Shared utilities
├── config.ts          # Centralized configuration (AI models, units, etc.)
├── types.ts           # TypeScript interfaces
├── supabase.ts        # Supabase client
└── database.types.ts  # Database table types

docs/                  # Documentation
└── ENHANCEMENTS.md    # Future feature roadmap
```

## Key Patterns

### API Routes
- Use `function getSupabase()` pattern for lazy-loading (avoids build-time errors)
- Return `{ success: boolean, data?, error? }` format
- Use `(param as any)` for Supabase query results (TypeScript workaround)

```typescript
// Example API route pattern
export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("bottles").select("*");
  if (error) return NextResponse.json({ success: false, error: error.message });
  return NextResponse.json({ success: true, bottles: data });
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

## Configuration

All configurable values are in `lib/config.ts`:
- AI model names
- Token limits
- Default units (metric/imperial)
- Common mixers list (for recipe matching)

## Database Schema

### bottles
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
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
| bottle_id | uuid | Foreign key |
| event_type | text | 'added', 'finished', 'adjusted' |
| quantity_change | integer | +1 for add, -1 for finish |
| event_date | timestamp | When it happened |

## Common Tasks

### Adding a new API endpoint
1. Create folder in `app/api/[name]/`
2. Create `route.ts` with HTTP method handlers
3. Use `getSupabase()` for database access
4. Return JSON with `{ success, data/error }`

### Adding a new page
1. Create folder in `app/[name]/`
2. Create `page.tsx` (add `"use client"` if interactive)
3. Add link to navigation in `app/layout.tsx` if needed

### Modifying AI behavior
1. Edit prompts in API routes (`app/api/identify/route.ts`, `app/api/recipes/route.ts`)
2. Change model in `lib/config.ts`

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

## Known Quirks

1. **Tailwind v4** - Uses `@import "tailwindcss"` not `@tailwind base`
2. **Supabase types** - Use `as any` for query results to avoid TypeScript errors
3. **Image storage** - Currently stores base64 in database (not ideal for large scale)
4. **No auth** - Single user app, RLS policies allow all access

## Testing Locally

```bash
npm run dev          # Start dev server
npm run build        # Test production build
npm run lint         # Run ESLint
```

## Future Enhancements

See `docs/ENHANCEMENTS.md` for planned features including:
- Back label photo support
- Batch import (photograph shelf)
- Barcode scanning fallback
- Consumption analytics with charts
- PWA install prompt
