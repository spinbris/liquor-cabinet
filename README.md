# 🥃 Liquor Cabinet

An AI-powered home bar inventory app that lets you photograph bottles, track your collection, and discover cocktails you can make.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)
![Claude AI](https://img.shields.io/badge/Claude-Haiku_4.5-orange)

## ✨ Features

### 🔐 User Accounts
- **Google Sign-In** - one click to sign up/sign in
- **Private cabinets** - each user has their own inventory
- Secure authentication via Supabase Auth

### 📸 AI Bottle Identification
- Take a photo of any bottle
- Claude Vision AI identifies brand, product, category, ABV, and more
- Works with spirits, liqueurs, wine, and beer

### 🗄️ Inventory Management
- Track bottles with quantities
- Organized by category (Whisky, Gin, Rum, Vodka, etc.)
- Add multiple bottles at once
- Mark bottles as finished (tracks consumption)
- Delete incorrect entries

### 🍸 Cocktail Recipes
- AI-generated recipes based on your inventory
- **Recipe search** - look up any cocktail (e.g., "Garibaldi")
- **Voice search** - tap 🎤 and say a cocktail name
- Shows which spirits you have vs need (✓/✗)
- Real cocktail images from TheCocktailDB
- Metric/Imperial measurement toggle
- Difficulty ratings

### 📺 Kitchen Mode
- **Cast-friendly display** optimized for Google Nest Hub Max
- Extra large text readable from across the kitchen
- Voice search while casting from phone
- Clean, focused recipe view

### 📊 Dashboard Stats
- Total bottles in cabinet
- Number of categories
- Bottles finished this month
- Consumption tracking over time

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Anthropic API key
- Supabase account
- Google Cloud project (for OAuth)

### Installation

```bash
# Clone the repo
git clone https://github.com/spinbris/liquor-cabinet.git
cd liquor-cabinet

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local
```

### Environment Variables

Edit `.env.local` with your keys:

```bash
# Anthropic API (for Claude Vision)
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → APIs & Services → OAuth consent screen → Configure
3. Create credentials → OAuth client ID → Web application
4. Add redirect URIs:
   - `http://localhost:3000/auth/callback` (dev)
   - `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback` (prod)
5. Copy Client ID and Client Secret

### Supabase Auth Setup

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Paste Client ID and Client Secret from Google
4. Save

### Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Bottles table
create table bottles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  brand text not null,
  product_name text not null,
  category text not null,
  sub_category text,
  country_of_origin text,
  region text,
  abv numeric,
  size_ml integer,
  description text,
  tasting_notes text,
  image_url text,
  quantity integer default 1,
  notes text,
  dan_murphys_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Inventory events table (for consumption tracking)
create table inventory_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  bottle_id uuid references bottles(id) on delete cascade,
  event_type text not null check (event_type in ('added', 'finished', 'adjusted')),
  quantity_change integer not null,
  purchase_price numeric,
  purchase_source text,
  notes text,
  event_date timestamp with time zone default now()
);

-- Enable RLS
alter table bottles enable row level security;
alter table inventory_events enable row level security;

-- RLS policies - users can only access their own data
create policy "Users can view own bottles" on bottles
  for select using (auth.uid() = user_id);
create policy "Users can insert own bottles" on bottles
  for insert with check (auth.uid() = user_id);
create policy "Users can update own bottles" on bottles
  for update using (auth.uid() = user_id);
create policy "Users can delete own bottles" on bottles
  for delete using (auth.uid() = user_id);

create policy "Users can view own events" on inventory_events
  for select using (auth.uid() = user_id);
create policy "Users can insert own events" on inventory_events
  for insert with check (auth.uid() = user_id);

-- Indexes
create index bottles_user_idx on bottles(user_id);
create index bottles_category_idx on bottles(category);
create index inventory_events_user_idx on inventory_events(user_id);
create index inventory_events_bottle_idx on inventory_events(bottle_id);
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📱 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com/new)
3. Add environment variables
4. Deploy

The app is PWA-capable and works great on mobile for photographing bottles.

## 📺 Using with Google Nest Hub

Kitchen Mode (`/kitchen`) is designed for casting to smart displays:

1. Open the app on your phone, navigate to `/kitchen`
2. Say "Hey Google, cast my screen"
3. Tap 🎤 on your phone and say a cocktail name
4. Recipe displays on the Nest Hub with large, readable text

Note: Google Nest Hub doesn't support opening websites via voice command directly, so casting from your phone is the recommended approach.

## 🏗️ Project Structure

```
liquor-cabinet/
├── app/
│   ├── page.tsx              # Home dashboard
│   ├── layout.tsx            # Root layout with NavBar
│   ├── globals.css           # Tailwind styles
│   ├── auth/
│   │   ├── page.tsx          # Sign-in page
│   │   └── callback/         # OAuth callback handler
│   ├── add/
│   │   └── page.tsx          # Add bottle (photo + AI)
│   ├── inventory/
│   │   ├── page.tsx          # Inventory grid
│   │   └── [id]/
│   │       └── page.tsx      # Bottle detail page
│   ├── recipes/
│   │   └── page.tsx          # Cocktail recipes + search + voice
│   ├── kitchen/
│   │   └── page.tsx          # Kitchen mode (cast-friendly)
│   └── api/
│       ├── identify/         # Claude Vision API
│       ├── bottles/          # CRUD operations (user-filtered)
│       │   └── [id]/
│       │       ├── route.ts  # GET/PUT/DELETE
│       │       └── finish/   # Mark as finished
│       ├── recipes/
│       │   ├── route.ts      # Recipe suggestions (user-filtered)
│       │   └── search/       # Recipe search
│       └── stats/            # Dashboard stats (user-filtered)
├── components/
│   └── NavBar.tsx            # Navigation with user menu
├── lib/
│   ├── config.ts             # App configuration
│   ├── supabase-browser.ts   # Client-side Supabase
│   ├── supabase-server.ts    # Server-side Supabase
│   ├── types.ts              # TypeScript interfaces
│   └── database.types.ts     # Database types
├── middleware.ts             # Route protection
├── docs/
│   └── ENHANCEMENTS.md       # Future roadmap
├── CLAUDE.md                 # AI assistant instructions
└── README.md                 # This file
```

## ⚙️ Configuration

Edit `lib/config.ts` to customize:

```typescript
export const config = {
  ai: {
    identifyModel: "claude-haiku-4-5-20251001",  // Vision model (cost-efficient)
    recipeModel: "claude-haiku-4-5-20251001",    // Recipe model
  },
  units: {
    default: "metric",  // "metric" or "imperial"
  },
  recipes: {
    suggestionCount: 8,
  },
};
```

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (Google OAuth)
- **AI:** Claude Haiku 4.5 (Anthropic)
- **Images:** TheCocktailDB API
- **Voice:** Web Speech API (browser-native)
- **Hosting:** Vercel

## 💰 Running Costs

| Service | Cost |
|---------|------|
| Vercel | Free tier |
| Supabase | Free tier |
| Claude API | ~$0.001/bottle ID |

Typical usage for 5 users: **<$0.10/month**

## 📄 License

MIT

## 🙏 Acknowledgments

- [Anthropic](https://anthropic.com) for Claude AI
- [TheCocktailDB](https://thecocktaildb.com) for cocktail images
- [Supabase](https://supabase.com) for database and auth
