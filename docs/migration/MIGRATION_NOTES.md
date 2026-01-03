# Migration Notes - 2026-01-03

## Original Supabase Configuration

**Project Details:**
- Project URL: https://wnesrfnlgmhtfafcgstr.supabase.co
- Anon Key: sb_publishable_KsS9Ki27Onoz5TFE6mMAZA_ivnzZ8_0
- Google OAuth Redirect URI: https://wnesrfnlgmhtfafcgstr.supabase.co/auth/v1/callback

**Environment Variables (BEFORE):**
```
ANTHROPIC_API_KEY=sk-ant-api03-ZEH...yqQ-jtPs0QAA (KEEP - no change)
NEXT_PUBLIC_SUPABASE_URL=https://wnesrfnlgmhtfafcgstr.supabase.co (REMOVE)
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_KsS9Ki27Onoz5TFE6mMAZA_ivnzZ8_0 (REMOVE)
```

**Environment Variables (AFTER):**
```
ANTHROPIC_API_KEY=[same as above]
DATABASE_URL=[Neon connection string - to be added]
AUTH_SECRET=[generated secret - to be added]
AUTH_GOOGLE_ID=[Google OAuth client ID - to be added]
AUTH_GOOGLE_SECRET=[Google OAuth secret - to be added]
```

## Data Export

**Actual Inventory Size:** 51 bottles, 60 inventory events

**Tables Exported:**
- [x] bottles table: 51 rows exported (34MB - includes base64 images)
- [x] inventory_events table: 60 rows exported
- [x] Export date: 2026-01-03
- [x] Export location: docs/migration/exports/
- [x] Files: bottles_rows.csv, inventory_events_rows.csv
- [x] Schema: Liquor_Cabinet_supabase_schema.rtf

**User ID (Supabase):** ee9192f0-8e96-4ec0-bd4a-c9ce842868c0

## Migration Timeline

**Start Date:** 2026-01-03
**Status:** In Progress - Phase 1

### Phase 1: Planning & Preparation
- [x] Step 1.1: Git backup created (backup/pre-neon-migration)
- [x] Step 1.2: Environment documented
- [ ] Step 1.3: Export Supabase data
- [ ] Step 1.4: Set up Neon Postgres
- [ ] Step 1.5: Create database schema
- [ ] Step 1.6: Import data to Neon

## Rollback Information

**Backup Branch:** backup/pre-neon-migration
- Created: 2026-01-03
- Pushed to: https://github.com/spinbris/liquor-cabinet
- Last commit: c652d9e

**Supabase Project:**
- Status: ACTIVE (will pause after successful migration)
- Can restore data if needed

## Notes

- Migration being done phase-by-phase
- May span multiple sessions
- Testing thoroughly before production deployment
