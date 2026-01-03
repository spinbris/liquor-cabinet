# Liquor Cabinet: Supabase to Auth.js + Neon Migration Plan

**Created:** 2026-01-03
**Status:** ⏳ PENDING APPROVAL
**Methodology:** Four Hats (Planner → Approver → Builder → Reviewer)
**Estimated Time:** 3-4 hours
**Cost Savings:** $25/month → $0/month

---

## 🎯 Objective

Migrate Liquor Cabinet app from Supabase (auth + database) to Auth.js + Neon Postgres to eliminate $25/month recurring cost while preserving all functionality and data.

### Migration Overview

| Component | Before (Supabase) | After (Auth.js + Neon) |
|-----------|------------------|------------------------|
| **Hosting** | Vercel | Vercel (no change) |
| **Framework** | Next.js 16 | Next.js 16 (no change) |
| **Auth** | Supabase (Google OAuth) | Auth.js v5 (Google OAuth) |
| **Database** | Supabase Postgres | Neon Postgres (free tier) |
| **Cost** | $25/month | $0/month |

---

## 📋 Pre-Migration Checklist

Before starting, verify:

- [x] You have data in Supabase (personal inventory)
- [x] Access to Supabase dashboard
- [x] Can create Neon account (free, no credit card)
- [ ] Google Cloud Console access (for OAuth redirect URI updates)
- [ ] Vercel dashboard access (for environment variables)
- [ ] Local development environment working (`npm run dev`)
- [ ] Git repo is clean (`git status`)

---

## 🏗️ Architecture Changes

### Current Architecture
```
┌──────────────┐
│   User       │
└──────┬───────┘
       │
       ▼
┌──────────────┐      ┌─────────────────┐
│   Vercel     │─────►│   Supabase      │
│  (Next.js)   │      │  - Auth (OAuth) │
│              │      │  - Postgres DB  │
└──────────────┘      │  $25/month      │
                      └─────────────────┘
```

### Target Architecture
```
┌──────────────┐
│   User       │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│      Vercel          │
│  (Next.js 16)        │
│                      │
│  ┌────────────────┐  │
│  │   Auth.js v5   │  │─────► Google OAuth
│  │   (Middleware) │  │       (free)
│  └────────────────┘  │
│         │            │
└─────────┼────────────┘
          │
          ▼
   ┌──────────────┐
   │ Neon Postgres│
   │  (free tier) │
   │  0.5GB storage│
   └──────────────┘
```

---

## 📊 Current Codebase Analysis

### Supabase Integration Points

| Component | File(s) | Change Required |
|-----------|---------|-----------------|
| **Auth Library** | `lib/supabase-browser.ts`<br>`lib/supabase-server.ts` | Replace with Auth.js |
| **Middleware** | `middleware.ts` | Update to use Auth.js session |
| **Auth Pages** | `app/auth/page.tsx`<br>`app/auth/callback/route.ts` | Update to use Auth.js |
| **API Routes** | 7 route handlers | Replace `supabase.auth.getUser()` with Auth.js session |
| **Database Calls** | All API routes | Replace Supabase client with Neon client |
| **Dependencies** | `package.json` | Remove Supabase, add Auth.js + Neon |
| **Environment** | `.env.local`, Vercel | Update variables |

### API Routes to Update (7 files)
1. `app/api/bottles/route.ts` - GET/POST bottles
2. `app/api/bottles/[id]/route.ts` - GET/PUT/DELETE single bottle
3. `app/api/bottles/[id]/finish/route.ts` - POST mark finished
4. `app/api/identify/route.ts` - POST AI bottle identification
5. `app/api/recipes/route.ts` - GET AI recipe suggestions
6. `app/api/recipes/search/route.ts` - POST search cocktail
7. `app/api/stats/route.ts` - GET dashboard statistics

### Database Schema

**Tables to migrate:**

**bottles** table:
```sql
CREATE TABLE bottles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  brand TEXT NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  country_of_origin TEXT,
  region TEXT,
  abv NUMERIC,
  size_ml NUMERIC,
  description TEXT,
  tasting_notes TEXT,
  image_url TEXT,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  dan_murphys_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**inventory_events** table:
```sql
CREATE TABLE inventory_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  bottle_id UUID NOT NULL REFERENCES bottles(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('added', 'finished', 'adjusted')),
  quantity_change INTEGER NOT NULL,
  purchase_price NUMERIC,
  purchase_source TEXT,
  notes TEXT,
  event_date TIMESTAMPTZ DEFAULT now()
);
```

**Note:** Current `database.types.ts` is missing `user_id` fields - will be added during migration.

---

# PHASE 1: Planning & Preparation

**Time:** 30-45 minutes
**Risk:** LOW (no code changes, fully reversible)

## Step 1.1: Git Safety Backup (5 min)

```bash
# Navigate to project
cd ~/projects/liquor-cabinet

# Verify clean state
git status

# Create backup branch
git checkout -b backup/pre-neon-migration
git push origin backup/pre-neon-migration

# Return to main
git checkout main
```

**Verification:**
- [ ] Backup branch created locally
- [ ] Backup branch pushed to remote
- [ ] Back on main branch

---

## Step 1.2: Document Current Environment (5 min)

**Read your current `.env.local` and document:**

```bash
# Check current environment variables
cat .env.local
```

**Document these values** (you'll need them for rollback):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY` (keep this, doesn't change)

**Create migration notes file:**

```bash
mkdir -p docs/migration
touch docs/migration/MIGRATION_NOTES.md
```

Add to `MIGRATION_NOTES.md`:
```markdown
# Migration Notes - [DATE]

## Original Supabase Configuration
- Project URL: [your-project-url]
- Anon Key: [first 20 chars...]
- Google OAuth Redirect URI: https://[your-project].supabase.co/auth/v1/callback

## Data Export
- Bottles table: [X] rows exported
- Inventory events: [X] rows exported
- Export date: [DATE/TIME]
```

---

## Step 1.3: Export Supabase Data (10 min)

### Option A: Via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your Liquor Cabinet project
3. Navigate to **Table Editor**
4. For **bottles** table:
   - Click the table
   - Click "..." menu → "Export to CSV"
   - Save as `supabase_export_bottles_[DATE].csv`
5. For **inventory_events** table:
   - Repeat export process
   - Save as `supabase_export_inventory_events_[DATE].csv`

### Option B: Via SQL Editor (Backup method)

In Supabase SQL Editor, run:

```sql
-- Export bottles (copy results to CSV)
SELECT * FROM bottles ORDER BY created_at;

-- Export inventory_events (copy results to CSV)
SELECT * FROM inventory_events ORDER BY event_date;

-- Get row counts for verification
SELECT 'bottles' as table_name, COUNT(*) as row_count FROM bottles
UNION ALL
SELECT 'inventory_events', COUNT(*) FROM inventory_events;
```

**Save exports to:**
```bash
mkdir -p docs/migration/exports
# Move CSV files to this directory
```

**Verification:**
- [ ] Bottles CSV exported with all data
- [ ] Inventory events CSV exported with all data
- [ ] Row counts documented
- [ ] Files saved to `docs/migration/exports/`

---

## Step 1.4: Set Up Neon Postgres (15 min)

### Create Neon Account

1. Go to https://neon.tech
2. Click "Sign Up" (use your Google account for easy access)
3. Create new project:
   - **Project name:** `liquor-cabinet-prod`
   - **Postgres version:** 16 (latest)
   - **Region:** Select closest to your Vercel region (likely `aws-ap-southeast-2` for Sydney)
4. Copy the connection string - it looks like:
   ```
   postgresql://[user]:[password]@[host]/[database]?sslmode=require
   ```

### Save Connection String

Add to your `.env.local` (don't commit yet):
```bash
# Add this line (keep existing Supabase vars for now)
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"
```

**Verification:**
- [ ] Neon account created
- [ ] Project created
- [ ] Connection string copied and saved
- [ ] Region selected (Australia/Singapore)

---

## Step 1.5: Create Database Schema in Neon (10 min)

### Connect to Neon SQL Editor

1. In Neon dashboard, click "SQL Editor"
2. Run the following schema creation script:

```sql
-- Create bottles table
CREATE TABLE bottles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,  -- Will store Auth.js user.id (Google sub)
  brand TEXT NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  country_of_origin TEXT,
  region TEXT,
  abv NUMERIC,
  size_ml NUMERIC,
  description TEXT,
  tasting_notes TEXT,
  image_url TEXT,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  dan_murphys_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create inventory_events table
CREATE TABLE inventory_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,  -- Will store Auth.js user.id (Google sub)
  bottle_id UUID NOT NULL REFERENCES bottles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('added', 'finished', 'adjusted')),
  quantity_change INTEGER NOT NULL,
  purchase_price NUMERIC,
  purchase_source TEXT,
  notes TEXT,
  event_date TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_bottles_user_id ON bottles(user_id);
CREATE INDEX idx_bottles_category ON bottles(category);
CREATE INDEX idx_bottles_quantity ON bottles(quantity);
CREATE INDEX idx_inventory_events_user_id ON inventory_events(user_id);
CREATE INDEX idx_inventory_events_bottle_id ON inventory_events(bottle_id);
CREATE INDEX idx_inventory_events_date ON inventory_events(event_date);

-- Verify tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Verification:**
- [ ] Tables created successfully
- [ ] Indexes created
- [ ] No errors in SQL editor

---

## Step 1.6: Import Data to Neon (10 min)

### Prepare Import Data

Since you're the only user, we need to:
1. Get your Google user ID (will do this after Auth.js setup)
2. For now, import with a placeholder user_id
3. Update user_id values in Phase 3 after first login

### Import via Neon Dashboard

**Option A: SQL Insert (Recommended for small datasets)**

In Neon SQL Editor, manually create INSERT statements from your CSV:

```sql
-- Example (replace with your actual data from CSV)
INSERT INTO bottles (
  id, user_id, brand, product_name, category, sub_category,
  abv, size_ml, quantity, image_url, created_at
) VALUES (
  gen_random_uuid(),
  'PLACEHOLDER_USER_ID',  -- Will update after first Auth.js login
  'Laphroaig',
  '10 Year Old',
  'whisky',
  'single malt',
  40.0,
  700,
  1,
  'data:image/jpeg;base64,...',
  now()
);

-- Repeat for each bottle...
```

**Option B: Use a migration script (if you have many bottles)**

I can help create a Node.js script to import from CSV.

**Verification:**
- [ ] Data imported to Neon
- [ ] Row counts match Supabase exports
- [ ] Sample query returns expected data

```sql
-- Verify import
SELECT COUNT(*) FROM bottles;
SELECT COUNT(*) FROM inventory_events;
SELECT * FROM bottles LIMIT 5;
```

---

## Phase 1 Deliverables

At the end of Phase 1, you should have:

- [x] Backup branch created (`backup/pre-neon-migration`)
- [x] Current environment variables documented
- [x] Supabase data exported (CSV files)
- [x] Neon account created
- [x] Neon database created with schema
- [x] Data imported to Neon (with placeholder user_id)
- [x] Migration notes documented

**Before proceeding to Phase 2:**
- Verify all checkboxes above
- Keep Supabase project active (don't pause yet)
- Confirm you're ready to modify code

---

# PHASE 2: Install Auth.js Dependencies

**Time:** 10 minutes
**Risk:** LOW (just dependency changes)

## Step 2.1: Install Auth.js Packages

```bash
# Install Auth.js v5 (beta) and Neon serverless driver
npm install next-auth@beta @auth/core @neondatabase/serverless

# Install additional crypto support (required for Auth.js)
npm install jose
```

**Verification:**
```bash
# Check package.json was updated
grep "next-auth" package.json
grep "@neondatabase/serverless" package.json
```

---

## Step 2.2: Generate Auth Secret

```bash
# Generate a secure random secret
openssl rand -base64 32
```

Copy the output and add to `.env.local`:
```bash
AUTH_SECRET="[paste the generated secret here]"
```

**Verification:**
- [ ] Dependencies installed
- [ ] `AUTH_SECRET` added to `.env.local`
- [ ] No npm errors

---

# PHASE 3: Set Up Auth.js Configuration

**Time:** 30 minutes
**Risk:** MEDIUM (core auth setup)

## Step 3.1: Create Auth.js Configuration File

**Create `lib/auth.ts`:**

```typescript
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Add user ID to session for database queries
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth",
  },
  trustHost: true,
});
```

**Create TypeScript declaration `types/next-auth.d.ts`:**

```typescript
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
```

**Verification:**
- [ ] `lib/auth.ts` created
- [ ] `types/next-auth.d.ts` created
- [ ] No TypeScript errors

---

## Step 3.2: Create Auth API Route Handler

**Create `app/api/auth/[...nextauth]/route.ts`:**

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

**Verification:**
- [ ] Route handler created
- [ ] File in correct location

---

## Step 3.3: Set Up Google OAuth Credentials

### Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create new one: "Liquor Cabinet")
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Name: "Liquor Cabinet - Production"
7. **Authorized redirect URIs:**
   - Add: `http://localhost:3000/api/auth/callback/google` (for local dev)
   - Add: `https://[your-vercel-domain]/api/auth/callback/google` (for production)
8. Click **Create**
9. Copy **Client ID** and **Client Secret**

### Add to Environment Variables

Update `.env.local`:
```bash
AUTH_GOOGLE_ID="[your-client-id].apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="[your-client-secret]"
```

**Verification:**
- [ ] Google OAuth app created
- [ ] Redirect URIs configured (localhost + production)
- [ ] Client ID and Secret saved to `.env.local`

---

# PHASE 4: Update Middleware

**Time:** 15 minutes
**Risk:** MEDIUM (affects all route protection)

## Step 4.1: Replace Middleware

**Replace contents of `middleware.ts`:**

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Define public routes
  const publicRoutes = ["/auth"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect to auth if not logged in and accessing protected route
  if (!isLoggedIn && !isPublicRoute) {
    const newUrl = new URL("/auth", req.nextUrl.origin);
    return NextResponse.redirect(newUrl);
  }

  // Redirect to home if logged in and trying to access auth page
  if (isLoggedIn && pathname === "/auth") {
    const newUrl = new URL("/", req.nextUrl.origin);
    return NextResponse.redirect(newUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files
     * - api/auth (Auth.js routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/auth).*)",
  ],
};
```

**Verification:**
- [ ] Middleware updated
- [ ] No TypeScript errors
- [ ] Config matcher updated to exclude `/api/auth`

---

# PHASE 5: Update Auth Pages

**Time:** 20 minutes
**Risk:** MEDIUM (affects login flow)

## Step 5.1: Update Sign-In Page

**Replace `app/auth/page.tsx`:**

```typescript
"use client";

import { signIn } from "next-auth/react";

export default function AuthPage() {
  const handleGoogleSignIn = async () => {
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🥃</div>
          <h1 className="text-3xl font-bold text-neutral-100 mb-2">
            Liquor Cabinet
          </h1>
          <p className="text-neutral-400">
            Your personal bar inventory & cocktail assistant
          </p>
        </div>

        {/* Sign In Card */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-neutral-100 text-center mb-6">
            Sign in to continue
          </h2>

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {/* Google Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>

          <p className="text-neutral-500 text-sm text-center mt-6">
            Your inventory is private and only visible to you
          </p>
        </div>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="text-neutral-400">
            <div className="text-2xl mb-1">📸</div>
            <div className="text-xs">AI Bottle ID</div>
          </div>
          <div className="text-neutral-400">
            <div className="text-2xl mb-1">🍸</div>
            <div className="text-xs">Cocktail Recipes</div>
          </div>
          <div className="text-neutral-400">
            <div className="text-2xl mb-1">🎤</div>
            <div className="text-xs">Voice Search</div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Install next-auth React hooks:**

```bash
npm install next-auth
```

**Verification:**
- [ ] Auth page updated
- [ ] Uses `signIn` from `next-auth/react`
- [ ] No TypeScript errors

---

## Step 5.2: Delete Supabase Auth Callback

```bash
# Remove Supabase callback (Auth.js handles this internally)
rm -rf app/auth/callback
```

**Verification:**
- [ ] `app/auth/callback` directory removed

---

# PHASE 6: Create Database Client Library

**Time:** 15 minutes
**Risk:** MEDIUM (core database connectivity)

## Step 6.1: Create Neon Database Client

**Create `lib/neon.ts`:**

```typescript
import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL!);

// Helper to get typed results
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  return sql(text, params) as Promise<T[]>;
}
```

**Verification:**
- [ ] `lib/neon.ts` created
- [ ] No TypeScript errors

---

## Step 6.2: Update Database Types

**Update `lib/database.types.ts` to add `user_id`:**

```typescript
export interface Database {
  public: {
    Tables: {
      bottles: {
        Row: {
          id: string;
          user_id: string;  // ADDED
          brand: string;
          product_name: string;
          category: string;
          sub_category: string | null;
          country_of_origin: string | null;
          region: string | null;
          abv: number | null;
          size_ml: number | null;
          description: string | null;
          tasting_notes: string | null;
          image_url: string | null;
          quantity: number;
          notes: string | null;
          dan_murphys_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;  // ADDED
          brand: string;
          product_name: string;
          category: string;
          sub_category?: string | null;
          country_of_origin?: string | null;
          region?: string | null;
          abv?: number | null;
          size_ml?: number | null;
          description?: string | null;
          tasting_notes?: string | null;
          image_url?: string | null;
          quantity?: number;
          notes?: string | null;
          dan_murphys_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;  // ADDED
          brand?: string;
          product_name?: string;
          category?: string;
          sub_category?: string | null;
          country_of_origin?: string | null;
          region?: string | null;
          abv?: number | null;
          size_ml?: number | null;
          description?: string | null;
          tasting_notes?: string | null;
          image_url?: string | null;
          quantity?: number;
          notes?: string | null;
          dan_murphys_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory_events: {
        Row: {
          id: string;
          user_id: string;  // ADDED
          bottle_id: string;
          event_type: "added" | "finished" | "adjusted";
          quantity_change: number;
          purchase_price: number | null;
          purchase_source: string | null;
          notes: string | null;
          event_date: string;
        };
        Insert: {
          id?: string;
          user_id: string;  // ADDED
          bottle_id: string;
          event_type: "added" | "finished" | "adjusted";
          quantity_change: number;
          purchase_price?: number | null;
          purchase_source?: string | null;
          notes?: string | null;
          event_date?: string;
        };
        Update: {
          id?: string;
          user_id?: string;  // ADDED
          bottle_id?: string;
          event_type?: "added" | "finished" | "adjusted";
          quantity_change?: number;
          purchase_price?: number | null;
          purchase_source?: string | null;
          notes?: string | null;
          event_date?: string;
        };
      };
    };
  };
}

export type Bottle = Database["public"]["Tables"]["bottles"]["Row"];
export type BottleInsert = Database["public"]["Tables"]["bottles"]["Insert"];
export type BottleUpdate = Database["public"]["Tables"]["bottles"]["Update"];
export type InventoryEvent = Database["public"]["Tables"]["inventory_events"]["Row"];
export type InventoryEventInsert = Database["public"]["Tables"]["inventory_events"]["Insert"];
```

**Verification:**
- [ ] `user_id` added to all type definitions
- [ ] No TypeScript errors

---

# PHASE 7: Migrate All API Routes

**Time:** 60-90 minutes
**Risk:** HIGH (core application functionality)

This is the most critical phase. We'll update all 7 API routes one by one.

## General Pattern for All Routes

**Before (Supabase):**
```typescript
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("bottles")
    .select("*")
    .eq("user_id", user.id);
}
```

**After (Auth.js + Neon):**
```typescript
import { auth } from "@/lib/auth";
import { sql } from "@/lib/neon";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bottles = await sql`
    SELECT * FROM bottles
    WHERE user_id = ${session.user.id}
  `;
}
```

---

## Route 1: `app/api/bottles/route.ts`

**Replace entire file:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/neon";
import { BottleInsert } from "@/lib/database.types";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const bottle: BottleInsert & { quantity?: number } = await request.json();
    const addQuantity = bottle.quantity || 1;
    const userId = session.user.id;

    // Check if bottle already exists for this user
    const existingList = await sql`
      SELECT id, quantity FROM bottles
      WHERE user_id = ${userId}
      AND LOWER(brand) = LOWER(${bottle.brand})
      AND LOWER(product_name) = LOWER(${bottle.product_name})
      AND quantity > 0
      LIMIT 1
    `;

    let resultBottle;

    if (existingList && existingList.length > 0) {
      const existing = existingList[0];
      const currentQty = existing.quantity ?? 0;

      // Update existing bottle
      const updated = await sql`
        UPDATE bottles
        SET
          quantity = ${currentQty + addQuantity},
          updated_at = NOW()
        WHERE id = ${existing.id}
        AND user_id = ${userId}
        RETURNING *
      `;
      resultBottle = updated[0];
    } else {
      // Insert new bottle
      const inserted = await sql`
        INSERT INTO bottles (
          user_id, brand, product_name, category, sub_category,
          country_of_origin, region, abv, size_ml, description,
          tasting_notes, image_url, quantity, notes, dan_murphys_url
        )
        VALUES (
          ${userId},
          ${bottle.brand},
          ${bottle.product_name},
          ${bottle.category},
          ${bottle.sub_category || null},
          ${bottle.country_of_origin || null},
          ${bottle.region || null},
          ${bottle.abv || null},
          ${bottle.size_ml || null},
          ${bottle.description || null},
          ${bottle.tasting_notes || null},
          ${bottle.image_url || null},
          ${addQuantity},
          ${bottle.notes || null},
          ${bottle.dan_murphys_url || null}
        )
        RETURNING *
      `;
      resultBottle = inserted[0];
    }

    // Create inventory event
    await sql`
      INSERT INTO inventory_events (
        user_id, bottle_id, event_type, quantity_change
      )
      VALUES (
        ${userId},
        ${resultBottle.id},
        'added',
        ${addQuantity}
      )
    `;

    return NextResponse.json({ success: true, bottle: resultBottle });
  } catch (error) {
    console.error("Add bottle error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add bottle" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const bottles = await sql`
      SELECT * FROM bottles
      WHERE user_id = ${session.user.id}
      AND quantity > 0
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ success: true, bottles });
  } catch (error) {
    console.error("Get bottles error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get bottles" },
      { status: 500 }
    );
  }
}
```

**Verification:**
- [ ] File updated
- [ ] No TypeScript errors

---

## Route 2: `app/api/bottles/[id]/route.ts`

**Replace entire file:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/neon";
import { BottleUpdate } from "@/lib/database.types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const bottles = await sql`
      SELECT * FROM bottles
      WHERE id = ${id}
      AND user_id = ${session.user.id}
    `;

    if (!bottles || bottles.length === 0) {
      return NextResponse.json({ error: "Bottle not found" }, { status: 404 });
    }

    return NextResponse.json({ bottle: bottles[0] });
  } catch (error) {
    console.error("Get bottle error:", error);
    return NextResponse.json(
      { error: "Failed to get bottle" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const updates: BottleUpdate = await request.json();

    const updated = await sql`
      UPDATE bottles
      SET
        brand = COALESCE(${updates.brand}, brand),
        product_name = COALESCE(${updates.product_name}, product_name),
        category = COALESCE(${updates.category}, category),
        sub_category = COALESCE(${updates.sub_category}, sub_category),
        country_of_origin = COALESCE(${updates.country_of_origin}, country_of_origin),
        region = COALESCE(${updates.region}, region),
        abv = COALESCE(${updates.abv}, abv),
        size_ml = COALESCE(${updates.size_ml}, size_ml),
        description = COALESCE(${updates.description}, description),
        tasting_notes = COALESCE(${updates.tasting_notes}, tasting_notes),
        notes = COALESCE(${updates.notes}, notes),
        dan_murphys_url = COALESCE(${updates.dan_murphys_url}, dan_murphys_url),
        updated_at = NOW()
      WHERE id = ${id}
      AND user_id = ${session.user.id}
      RETURNING *
    `;

    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: "Bottle not found" }, { status: 404 });
    }

    return NextResponse.json({ bottle: updated[0] });
  } catch (error) {
    console.error("Update bottle error:", error);
    return NextResponse.json(
      { error: "Failed to update bottle" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const deleted = await sql`
      DELETE FROM bottles
      WHERE id = ${id}
      AND user_id = ${session.user.id}
      RETURNING *
    `;

    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: "Bottle not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete bottle error:", error);
    return NextResponse.json(
      { error: "Failed to delete bottle" },
      { status: 500 }
    );
  }
}
```

**Verification:**
- [ ] File updated
- [ ] No TypeScript errors

---

## Route 3: `app/api/bottles/[id]/finish/route.ts`

**Replace entire file:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/neon";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Set quantity to 0
    const updated = await sql`
      UPDATE bottles
      SET
        quantity = 0,
        updated_at = NOW()
      WHERE id = ${id}
      AND user_id = ${session.user.id}
      RETURNING *
    `;

    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: "Bottle not found" }, { status: 404 });
    }

    // Create finished event
    await sql`
      INSERT INTO inventory_events (
        user_id, bottle_id, event_type, quantity_change
      )
      VALUES (
        ${session.user.id},
        ${id},
        'finished',
        -1
      )
    `;

    return NextResponse.json({ success: true, bottle: updated[0] });
  } catch (error) {
    console.error("Finish bottle error:", error);
    return NextResponse.json(
      { error: "Failed to finish bottle" },
      { status: 500 }
    );
  }
}
```

**Verification:**
- [ ] File updated
- [ ] No TypeScript errors

---

## Route 4: `app/api/identify/route.ts`

Read current file first to check if it uses Supabase:

```bash
grep -n "supabase" app/api/identify/route.ts
```

**If it uses Supabase for auth, update the auth check:**

```typescript
// Replace this:
import { createClient } from "@/lib/supabase-server";
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

// With this:
import { auth } from "@/lib/auth";
const session = await auth();
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Verification:**
- [ ] File updated (if needed)
- [ ] No TypeScript errors

---

## Route 5: `app/api/recipes/route.ts`

**Check if it needs Supabase for bottle data:**

```bash
grep -n "from.*bottles" app/api/recipes/route.ts
```

**If it queries bottles, update:**

```typescript
// Replace Supabase queries with:
import { auth } from "@/lib/auth";
import { sql } from "@/lib/neon";

const session = await auth();
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const bottles = await sql`
  SELECT brand, product_name, category, sub_category
  FROM bottles
  WHERE user_id = ${session.user.id}
  AND quantity > 0
`;
```

**Verification:**
- [ ] File updated
- [ ] No TypeScript errors

---

## Route 6: `app/api/recipes/search/route.ts`

**Similar to route 5:**

```typescript
import { auth } from "@/lib/auth";
import { sql } from "@/lib/neon";

const session = await auth();
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// If it queries bottles, update the query
const bottles = await sql`
  SELECT * FROM bottles
  WHERE user_id = ${session.user.id}
  AND quantity > 0
`;
```

**Verification:**
- [ ] File updated
- [ ] No TypeScript errors

---

## Route 7: `app/api/stats/route.ts`

**Replace with Neon queries:**

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/neon";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    // Total bottles
    const totalResult = await sql`
      SELECT COALESCE(SUM(quantity), 0) as total
      FROM bottles
      WHERE user_id = ${userId}
    `;

    // Categories breakdown
    const categoriesResult = await sql`
      SELECT
        category,
        COUNT(*) as count,
        SUM(quantity) as total_bottles
      FROM bottles
      WHERE user_id = ${userId}
      AND quantity > 0
      GROUP BY category
      ORDER BY total_bottles DESC
    `;

    // Recent additions
    const recentResult = await sql`
      SELECT
        b.brand,
        b.product_name,
        b.category,
        b.image_url,
        e.event_date
      FROM bottles b
      JOIN inventory_events e ON b.id = e.bottle_id
      WHERE b.user_id = ${userId}
      AND e.event_type = 'added'
      ORDER BY e.event_date DESC
      LIMIT 5
    `;

    return NextResponse.json({
      success: true,
      stats: {
        total: totalResult[0].total,
        categories: categoriesResult,
        recent: recentResult,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json(
      { error: "Failed to get statistics" },
      { status: 500 }
    );
  }
}
```

**Verification:**
- [ ] File updated
- [ ] No TypeScript errors

---

## Phase 7 Verification

After updating all routes:

```bash
# Check for any remaining Supabase imports
grep -r "from.*supabase" app/api --include="*.ts"

# Should return empty (no matches)
```

**Checklist:**
- [ ] All 7 API routes updated
- [ ] All use `auth()` instead of `supabase.auth.getUser()`
- [ ] All use `sql` template tag instead of Supabase client
- [ ] No remaining Supabase imports in API routes
- [ ] No TypeScript errors

---

# PHASE 8: Remove Supabase Dependencies

**Time:** 10 minutes
**Risk:** LOW

## Step 8.1: Delete Supabase Library Files

```bash
# Remove Supabase client files
rm lib/supabase-browser.ts
rm lib/supabase-server.ts
```

**Verification:**
- [ ] Files deleted

---

## Step 8.2: Update package.json

```bash
# Uninstall Supabase packages
npm uninstall @supabase/ssr @supabase/supabase-js
```

**Verification:**
```bash
# Should show no results
grep "supabase" package.json
```

---

## Step 8.3: Update Environment Variables

**Update `.env.local` - remove Supabase vars:**

```bash
# Remove these lines:
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Keep these:
ANTHROPIC_API_KEY=...
DATABASE_URL=...
AUTH_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
```

**Create `.env.example` for reference:**

```bash
# Auth.js
AUTH_SECRET=your-secret-here
AUTH_GOOGLE_ID=your-google-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-google-secret

# Database
DATABASE_URL=postgresql://user:pass@host/db

# AI
ANTHROPIC_API_KEY=sk-ant-...
```

**Verification:**
- [ ] Supabase vars removed from `.env.local`
- [ ] `.env.example` updated

---

# PHASE 9: Local Testing

**Time:** 30 minutes
**Risk:** MEDIUM

## Step 9.1: Start Development Server

```bash
# Install dependencies (clean)
rm -rf node_modules package-lock.json
npm install

# Start server
npm run dev
```

**Expected output:**
```
✓ Ready in [X]s
○ Local: http://localhost:3000
```

**Verification:**
- [ ] No build errors
- [ ] Server starts successfully

---

## Step 9.2: Test Authentication Flow

1. Navigate to http://localhost:3000
2. Should redirect to `/auth`
3. Click "Sign in with Google"
4. Complete Google OAuth flow
5. Should redirect to `/` (home)

**Verification:**
- [ ] Redirect to `/auth` works
- [ ] Google sign-in button appears
- [ ] OAuth flow completes
- [ ] Redirects to home after login
- [ ] User info appears in navbar

---

## Step 9.3: Test Database Queries

**Test these core features:**

1. **View Dashboard** (`/`)
   - Should show your stats
   - Check browser console for errors

2. **View Inventory** (`/inventory`)
   - Should show your bottles
   - Verify data loaded from Neon

3. **View Bottle Detail** (click on a bottle)
   - Should show bottle details
   - Try editing a bottle

4. **Add Bottle** (`/add`)
   - Take a photo or upload image
   - Verify AI identification works
   - Verify bottle saves to Neon

5. **Recipes** (`/recipes`)
   - Should load your inventory
   - Test cocktail suggestions

6. **Mark Bottle as Finished**
   - Go to bottle detail page
   - Click "Mark as Finished"
   - Verify quantity becomes 0

**Verification checklist:**
- [ ] Dashboard loads stats
- [ ] Inventory shows bottles
- [ ] Bottle detail pages work
- [ ] Can edit bottle info
- [ ] Can add new bottle
- [ ] Can mark bottle as finished
- [ ] Recipes page works
- [ ] All data filtered by user_id (only your data shows)

---

## Step 9.4: Check Browser Console

Open DevTools → Console and verify:
- [ ] No authentication errors
- [ ] No database connection errors
- [ ] No 401 Unauthorized errors
- [ ] API calls return 200 OK

---

## Step 9.5: Verify Data in Neon

In Neon SQL Editor:

```sql
-- Check user_id is being set correctly
SELECT user_id, COUNT(*) as bottle_count
FROM bottles
GROUP BY user_id;

-- Should show ONE user (you) with correct Google ID
-- The user_id should be a long alphanumeric string (Google sub)

-- Verify all bottles have user_id
SELECT COUNT(*) as bottles_without_user
FROM bottles
WHERE user_id IS NULL OR user_id = 'PLACEHOLDER_USER_ID';

-- Should return 0
```

**Verification:**
- [ ] All bottles have real user_id (not PLACEHOLDER)
- [ ] User_id matches your Google account ID
- [ ] No NULL user_ids

---

# PHASE 10: Update Vercel Environment Variables

**Time:** 15 minutes
**Risk:** MEDIUM

## Step 10.1: Update Vercel Env Vars

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your Liquor Cabinet project
3. Go to **Settings** → **Environment Variables**
4. **Delete:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. **Add:**
   - `AUTH_SECRET` = [your generated secret]
   - `AUTH_GOOGLE_ID` = [your Google client ID]
   - `AUTH_GOOGLE_SECRET` = [your Google client secret]
   - `DATABASE_URL` = [your Neon connection string]
6. Keep:
   - `ANTHROPIC_API_KEY` (no change)

**Verification:**
- [ ] Supabase vars removed
- [ ] Auth.js vars added
- [ ] Neon DATABASE_URL added
- [ ] All vars set for "Production" environment

---

## Step 10.2: Commit and Push

```bash
# Check what changed
git status

# Add all changes
git add -A

# Commit with detailed message
git commit -m "Migrate from Supabase to Auth.js + Neon Postgres

- Replace Supabase auth with Auth.js v5 (Google OAuth)
- Replace Supabase database with Neon Postgres
- Update all 7 API routes to use Auth.js sessions
- Replace Supabase client with @neondatabase/serverless
- Update middleware for Auth.js
- Update auth pages to use next-auth/react
- Add user_id to database types
- Remove @supabase/ssr and @supabase/supabase-js dependencies
- Update environment variables

Cost savings: \$25/month → \$0/month
Data migrated from Supabase to Neon successfully
All functionality preserved (auth, database, user filtering)"

# Push to trigger Vercel deployment
git push origin main
```

**Verification:**
- [ ] Commit created
- [ ] Pushed to GitHub
- [ ] Vercel deployment triggered

---

## Step 10.3: Monitor Deployment

Watch the Vercel deployment:

1. Go to Vercel dashboard
2. Click on the deployment (should be "Building...")
3. Check build logs for errors
4. Wait for "Ready" status

**Common issues:**
- Missing environment variables → Check they're all set
- Build errors → Check the logs, likely TypeScript errors
- Runtime errors → Check function logs

**Verification:**
- [ ] Build completes successfully
- [ ] Deployment shows "Ready"
- [ ] No errors in build logs

---

# PHASE 11: Production Testing

**Time:** 15 minutes
**Risk:** MEDIUM

## Step 11.1: Test Production Authentication

1. Visit your production URL (e.g., `https://liquor-cabinet.vercel.app`)
2. Should redirect to `/auth`
3. Click "Sign in with Google"
4. Complete OAuth flow
5. Should redirect to home

**If OAuth fails:**
- Check Google Cloud Console redirect URIs include production URL
- Should be: `https://[your-domain]/api/auth/callback/google`

**Verification:**
- [ ] Production site loads
- [ ] Auth redirect works
- [ ] Google OAuth completes
- [ ] Logs in successfully

---

## Step 11.2: Test All Features in Production

Run through the same tests as local:

1. **Dashboard** - View stats
2. **Inventory** - View bottles
3. **Bottle detail** - Edit bottle
4. **Add bottle** - Upload image, AI identify
5. **Recipes** - Get cocktail suggestions
6. **Mark finished** - Mark a bottle as finished

**Verification:**
- [ ] All pages load
- [ ] Data displays correctly
- [ ] Can add/edit/delete bottles
- [ ] AI features work (identify, recipes)
- [ ] All data properly filtered to your account

---

## Step 11.3: Test User Isolation (Critical!)

**This verifies other users can't see your data:**

1. Sign out from production app
2. Sign in with a DIFFERENT Google account (if you have one)
3. Verify you see an empty inventory (no bottles)
4. Add a test bottle with the second account
5. Sign out and sign back in with your original account
6. Verify you ONLY see your original bottles (not the test bottle)

**Verification:**
- [ ] Different users see different inventories
- [ ] User_id filtering working correctly
- [ ] Data isolation confirmed

---

## Step 11.4: Check Production Logs

In Vercel dashboard:

1. Go to **Functions** tab
2. Check for any errors in the logs
3. Look for database connection errors
4. Look for authentication errors

**Verification:**
- [ ] No errors in function logs
- [ ] API routes returning 200 OK
- [ ] Database queries succeeding

---

# PHASE 12: Cleanup & Documentation

**Time:** 15 minutes
**Risk:** NONE

## Step 12.1: Pause Supabase Project

**ONLY do this after confirming everything works in production!**

1. Go to https://supabase.com/dashboard
2. Select your Liquor Cabinet project
3. Go to **Settings** → **General**
4. Click **Pause project**
5. Confirm pause

**Don't delete yet - keep paused for 1-2 weeks as safety backup.**

**Verification:**
- [ ] Supabase project paused (not deleted)
- [ ] Production app still works (not connected to Supabase)

---

## Step 12.2: Update Documentation

**Update `CLAUDE.md`:**

Find and replace references to Supabase:

```markdown
## Tech Stack

- **Next.js 16** with App Router
- **TypeScript** - strict mode
- **Tailwind CSS v4**
- **Auth.js v5** - Google OAuth authentication  ← UPDATED
- **Neon Postgres** - Database (free tier)    ← UPDATED
- **Claude API** - Haiku 4.5 for Vision and text
- **Web Speech API** - Browser-native voice recognition
- **Vercel** - deployment platform

## Authentication Pattern

### Middleware (route protection)
Uses Auth.js middleware to protect all routes except /auth.  ← UPDATED

### Server-side auth (API routes)
```typescript
import { auth } from "@/lib/auth";  ← UPDATED

export async function GET() {
  const session = await auth();  ← UPDATED
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Filter by user_id
  const bottles = await sql`  ← UPDATED
    SELECT * FROM bottles
    WHERE user_id = ${session.user.id}
  `;
}
```

### Database Client  ← NEW SECTION
```typescript
import { sql } from "@/lib/neon";

// Query with template literals
const results = await sql`
  SELECT * FROM bottles WHERE user_id = ${userId}
`;
```
```

**Update environment variables section:**

```markdown
## Environment Variables

Required in `.env.local` (and Vercel):
```
ANTHROPIC_API_KEY=sk-ant-xxx
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
AUTH_SECRET=your-random-secret
AUTH_GOOGLE_ID=xxx.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=xxx
```
```

**Verification:**
- [ ] CLAUDE.md updated
- [ ] References to Supabase removed
- [ ] Auth.js and Neon documented

---

## Step 12.3: Update Migration Notes

Add final notes to `docs/migration/MIGRATION_NOTES.md`:

```markdown
## Migration Complete ✅

**Date:** [TODAY]
**Duration:** [X hours]
**Status:** SUCCESS

### Final Configuration

**Neon Postgres:**
- Project: liquor-cabinet-prod
- Region: [your region]
- Database size: [X] MB
- Tables: bottles, inventory_events
- Total records: [X] bottles, [X] events

**Auth.js:**
- Provider: Google OAuth
- Session strategy: JWT
- User ID source: Google sub claim

**Data Migration:**
- ✅ All bottles migrated
- ✅ All inventory events migrated
- ✅ User IDs properly set
- ✅ Data isolation verified

### Cost Savings
- Before: $25/month (Supabase)
- After: $0/month (Neon free tier + Auth.js)
- **Annual savings: $300**

### Rollback Available
- Backup branch: `backup/pre-neon-migration`
- Supabase project: PAUSED (not deleted)
- Can restore within [X] days if needed

### Next Steps
- [ ] Monitor Neon free tier usage (0.5 GB limit)
- [ ] Keep Supabase paused for 2 weeks, then delete
- [ ] Consider adding database backups
```

**Verification:**
- [ ] Migration notes completed
- [ ] All dates and metrics filled in

---

# 🎉 MIGRATION COMPLETE

## Success Criteria

At this point, you should have:

- [x] ✅ Authentication working (Google OAuth via Auth.js)
- [x] ✅ Database working (Neon Postgres)
- [x] ✅ All features functional (add, edit, delete, recipes, stats)
- [x] ✅ Data migrated from Supabase
- [x] ✅ User isolation verified
- [x] ✅ Production deployment successful
- [x] ✅ Cost reduced from $25/mo to $0/mo
- [x] ✅ Supabase project paused (backup available)

---

## 🔍 REVIEWER: Final Checklist

### Code Quality
- [ ] No Supabase dependencies remain in package.json
- [ ] No Supabase imports in code (grep returns empty)
- [ ] All TypeScript errors resolved
- [ ] No console errors in browser
- [ ] No errors in production logs

### Security
- [ ] User data properly isolated (tested with 2 accounts)
- [ ] All queries filter by user_id
- [ ] Environment variables secured in Vercel
- [ ] No credentials in git history
- [ ] AUTH_SECRET is strong and unique

### Functionality
- [ ] Google OAuth works (local + production)
- [ ] Can view inventory
- [ ] Can add bottles (photo upload + AI)
- [ ] Can edit bottles
- [ ] Can delete bottles
- [ ] Can mark bottles as finished
- [ ] Recipe suggestions work
- [ ] Voice search works
- [ ] Dashboard stats accurate
- [ ] Kitchen mode works

### Database
- [ ] All bottles have user_id set
- [ ] No NULL user_ids in Neon
- [ ] Row counts match Supabase export
- [ ] Indexes created for performance
- [ ] Foreign key constraints working

### Documentation
- [ ] CLAUDE.md updated
- [ ] Migration notes completed
- [ ] .env.example updated
- [ ] Commit messages clear

---

## 📈 Monitoring & Maintenance

### Neon Free Tier Limits
- **Storage:** 0.5 GB (monitor in Neon dashboard)
- **Compute:** 191.9 hours/month
- **Branches:** 10 max

**If you approach limits:**
- Compress/remove old base64 images
- Consider upgrading to Neon Pro ($19/mo - still saves $6/mo vs Supabase)
- Or move large images to Vercel Blob Storage

### Regular Checks
- Monthly: Check Neon storage usage
- Weekly: Review production error logs
- Daily: Basic app functionality test

---

## 🔄 Rollback Procedure

**If something goes wrong:**

```bash
# Step 1: Restore code
git checkout backup/pre-neon-migration
git checkout -b main-restored
git push -f origin main

# Step 2: Restore Vercel env vars
# In Vercel dashboard, re-add:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY

# Step 3: Un-pause Supabase project
# In Supabase dashboard, click "Restore project"

# Step 4: Redeploy
# Vercel will auto-deploy from git push

# Step 5: Verify
# Test production app works
```

---

## 📞 Troubleshooting

### Common Issues

**Issue: "Invalid redirect URI" on Google sign-in**
- Solution: Check Google Cloud Console → Credentials
- Verify redirect URI exactly matches: `https://[your-domain]/api/auth/callback/google`

**Issue: "Database connection failed"**
- Solution: Check DATABASE_URL in Vercel env vars
- Ensure connection string includes `?sslmode=require`

**Issue: "No bottles showing after login"**
- Solution: Check Neon SQL Editor:
  ```sql
  SELECT user_id, brand FROM bottles LIMIT 5;
  ```
- Verify user_id is set (not NULL or PLACEHOLDER)

**Issue: Build fails on Vercel**
- Solution: Check build logs for specific error
- Common: Missing env variables, TypeScript errors

**Issue: Neon connection times out**
- Solution: Neon free tier may suspend after inactivity
- Visit Neon dashboard to wake the database
- Consider upgrading if frequent issue

---

## 🎓 Lessons Learned

### What Went Well
- Gradual migration with backups at each step
- Testing in local before production
- Keeping Supabase paused (not deleted) for safety

### Future Improvements
- Consider adding automated database backups
- Move base64 images to Vercel Blob Storage for scalability
- Add error monitoring (e.g., Sentry)
- Consider adding tests before major migrations

---

## 📊 Final Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Monthly Cost** | $25 | $0 | -$25 |
| **Annual Cost** | $300 | $0 | -$300 |
| **Auth Provider** | Supabase | Auth.js | Free |
| **Database** | Supabase Postgres | Neon Postgres | Free tier |
| **Dependencies** | 2 (Supabase) | 2 (Auth.js + Neon) | Same |
| **Features** | All | All | No change |
| **Performance** | Good | Good | No change |

---

**Migration Status:** ✅ COMPLETE
**Date Completed:** [DATE]
**Total Time:** [X hours]
**Next Review:** [2 weeks from completion]
**Safe to Delete Supabase:** [After 2 weeks of stable operation]

---

**Document Version:** 1.0
**Created:** 2026-01-03
**Author:** Claude Code (Planning phase)
**Approved by:** [Your name]
**Status:** Ready for execution
