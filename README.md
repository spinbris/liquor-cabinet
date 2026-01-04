# 🥃 Liquor Cabinet

An AI-powered home bar inventory app that lets you photograph bottles, track your collection, and discover cocktails you can make.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)
![Claude AI](https://img.shields.io/badge/Claude-Haiku_4.5-orange)
![Neon](https://img.shields.io/badge/Neon-Serverless_Postgres-00E699)

## ✨ Features

### 🔐 User Accounts
- **Google Sign-In** - one click to sign up/sign in
- **Private cabinets** - each user has their own inventory
- Secure authentication via Auth.js (NextAuth v5)

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
- Neon account (free tier)
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

# Neon Database
DATABASE_URL=postgresql://user:pass@host.neon.tech/neondb?sslmode=require

# Auth.js (NextAuth v5)
AUTH_SECRET=your-generated-secret  # Generate with: openssl rand -base64 32
AUTH_GOOGLE_ID=xxxxx.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=xxxxx
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → APIs & Services → OAuth consent screen → Configure
3. Create credentials → OAuth client ID → Web application
4. Add redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://your-domain.vercel.app/api/auth/callback/google` (prod)
5. Copy Client ID and Client Secret to your `.env.local`

### Database Setup

Create a new project in [Neon Console](https://console.neon.tech/), then run this SQL:

```sql
-- Bottles table
CREATE TABLE bottles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  brand TEXT NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  country_of_origin TEXT,
  region TEXT,
  abv NUMERIC,
  size_ml INTEGER,
  description TEXT,
  tasting_notes TEXT,
  image_url TEXT,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  dan_murphys_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory events table (for consumption tracking)
CREATE TABLE inventory_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  bottle_id UUID REFERENCES bottles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('added', 'finished', 'adjusted')),
  quantity_change INTEGER NOT NULL,
  purchase_price NUMERIC,
  purchase_source TEXT,
  notes TEXT,
  event_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX bottles_user_idx ON bottles(user_id);
CREATE INDEX bottles_category_idx ON bottles(category);
CREATE INDEX inventory_events_user_idx ON inventory_events(user_id);
CREATE INDEX inventory_events_bottle_idx ON inventory_events(bottle_id);
```

**Note:** User data isolation is enforced at the application level. All API routes filter queries by the authenticated user's ID.

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
│   │   └── page.tsx          # Sign-in page
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
│       ├── auth/
│       │   └── [...nextauth]/ # Auth.js OAuth handlers
│       ├── identify/         # Claude Vision API
│       ├── bottles/          # CRUD operations (user-filtered)
│       │   └── [id]/
│       │       ├── route.ts  # GET/PUT/DELETE
│       │       └── finish/   # Decrement quantity
│       ├── recipes/
│       │   ├── route.ts      # Recipe suggestions (user-filtered)
│       │   └── search/       # Recipe search
│       └── stats/            # Dashboard stats (user-filtered)
├── components/
│   ├── NavBar.tsx            # Navigation with user menu
│   └── Providers.tsx         # SessionProvider wrapper
├── lib/
│   ├── config.ts             # App configuration
│   ├── auth.ts               # Auth.js configuration
│   ├── neon.ts               # Neon database client
│   ├── types.ts              # TypeScript interfaces
│   └── database.types.ts     # Database types
├── types/
│   └── next-auth.d.ts        # Auth.js type augmentation
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
- **Database:** Neon (Serverless PostgreSQL)
- **Auth:** Auth.js v5 / NextAuth (Google OAuth)
- **AI:** Claude Haiku 4.5 (Anthropic)
- **Images:** TheCocktailDB API
- **Voice:** Web Speech API (browser-native)
- **Hosting:** Vercel

## 💰 Running Costs

| Service | Cost |
|---------|------|
| Vercel | Free tier |
| Neon | Free tier (512 MB storage, 0.5 vCPU) |
| Claude API | ~$0.001/bottle ID |

Typical usage: **100% free** on free tiers (previously $25/month with Supabase paid tier)

## 📄 License

MIT

## 🙏 Acknowledgments

- [Anthropic](https://anthropic.com) for Claude AI
- [TheCocktailDB](https://thecocktaildb.com) for cocktail images
- [Neon](https://neon.tech) for serverless PostgreSQL
- [Auth.js](https://authjs.dev) for authentication
