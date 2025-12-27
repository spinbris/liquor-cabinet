# Future Enhancements Roadmap

## ✅ Completed Features

### Core Functionality
- [x] AI bottle identification with Claude Vision
- [x] Inventory management with quantities
- [x] Multi-quantity add (add 3 bottles at once)
- [x] Bottle detail page with +/- controls
- [x] Mark as finished (consumption tracking)
- [x] Delete entries with confirmation
- [x] Dashboard stats (total bottles, categories, finished this month)

### Recipes
- [x] AI-powered cocktail suggestions based on inventory
- [x] Cocktail images from TheCocktailDB
- [x] Ingredient matching (have ✓ / need ✗)
- [x] Metric/Imperial toggle
- [x] Recipe categories (Ready to Make, Almost There, Shopping List)
- [x] Recipe search ("How do I make X?")
- [x] Voice search (🎤 microphone input)
- [x] Kitchen Mode (cast-friendly large display)

### Authentication & Multi-User
- [x] Google Sign-In (one-click OAuth)
- [x] Private cabinets per user
- [x] Route protection (middleware)
- [x] User menu with sign out
- [x] Row Level Security (RLS) policies

### Technical
- [x] Centralized config file (`lib/config.ts`)
- [x] Mobile camera support (deployed to Vercel)
- [x] Dark theme with amber accents
- [x] Australian English voice recognition
- [x] Comprehensive documentation (README, CLAUDE.md)
- [x] Claude Haiku for cost efficiency (~90% savings)

---

## 📸 Image Capture Improvements

### Back Label Photo (Priority: High)
**Current:** Single front photo only
**Enhancement:** Optional back label photo for more complete data

**Proposed Flow:**
1. User uploads front label → Claude identifies bottle
2. Results shown with "📷 Add back label for more details" option
3. If user adds back photo, send both images to Claude for refined data
4. Merge results: back label ABV/volume overrides estimated values

**Benefits:**
- More accurate ABV, volume, origin data
- Better tasting notes from actual label
- Higher confidence scores

---

### Multiple Angle Photos (Priority: Medium)
Allow 2-4 photos for difficult-to-read bottles

---

### Camera Quality Guidance (Priority: Low)
- Show overlay guide for bottle positioning
- Auto-detect blur/lighting issues
- Suggest retake if image quality poor

---

## 🗄️ Inventory Features

### Edit Bottle Details (Priority: High)
- Edit mode on detail page
- Modify brand, product name, ABV, notes
- Correct AI misidentifications

### Batch Import (Priority: High)
- Photograph entire shelf
- Claude identifies multiple bottles in one image
- Quick confirm/add flow for each

### Search & Filter (Priority: Medium)
- Search by name, brand
- Filter by category
- Sort by date added, name, quantity

### Barcode Scanning Fallback (Priority: Medium)
- If photo recognition fails, offer barcode scan
- Query external database (Open Food Facts, UPC databases)

### Dan Murphy's Integration (Priority: Low)
- Paste Dan Murphy's product URL
- Auto-extract product details from their website
- Link purchase history via email parsing

---

## 🍸 Recipe Features

### Ingredient Substitutions (Priority: High)
- "You're missing X, but you have Y which could work"
- Claude suggests viable substitutions

### Save Favourite Recipes (Priority: Medium)
- Star/save recipes you like
- Quick access to favourites
- Remember which ones you've made

### Party Mode (Priority: Medium)
- "I'm hosting 8 people for a BBQ"
- Batch cocktail suggestions
- Quantity calculations

### Shopping List Export (Priority: Low)
- Export missing ingredients to:
  - Apple Reminders
  - Grocery apps
  - Dan Murphy's cart (if API available)

---

## 📊 Analytics

### Full Stats Page (Priority: High)
- Consumption chart over time (weekly/monthly)
- Most consumed spirits
- Category breakdown (pie chart)
- Recently finished bottles list

### Consumption Insights (Priority: Medium)
- Seasonal trends
- Cost per drink estimates
- "You're running low on..." alerts

### Collection Value (Priority: Low)
- Estimated total value
- Track price appreciation for premium bottles

---

## 🔗 Integrations

### Image Storage (Priority: High)
- Move from base64 in database to Supabase Storage
- Reduces database size
- Faster loading

### Smart Home (Priority: Low)
- Google Nest Hub direct integration (if Google adds website voice commands)
- Currently works via screen casting from phone

### Social Features (Priority: Low)
- Share your bar with friends
- Collaborative cocktail nights

---

## 📱 Mobile / PWA

### PWA Enhancements (Priority: Medium)
- Install prompt ("Add to Home Screen")
- App icon
- Splash screen
- Offline support (cache inventory locally)

### Push Notifications (Priority: Low)
- Low stock alerts
- Recipe of the day

---

## Technical Improvements

### Image Optimization (Priority: High)
- Compress images before sending to API
- Reduce API costs and latency
- Consider switching to Supabase Storage

### Better Type Safety (Priority: Medium)
- Generate Supabase types automatically
- Remove `as any` workarounds

### Testing (Priority: Low)
- Unit tests for API routes
- E2E tests with Playwright

---

*Last updated: December 2024*
