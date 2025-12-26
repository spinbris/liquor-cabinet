# Future Enhancements Roadmap

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

**Implementation Notes:**
- Modify API to accept array of images
- Update prompt to handle multi-image input
- UI: Add "Enhance with back label" button in results view

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

### Batch Import (Priority: High)
- Photograph entire shelf
- Claude identifies multiple bottles in one image
- Quick confirm/add flow for each

### Barcode Scanning Fallback (Priority: Medium)
- If photo recognition fails, offer barcode scan
- Query external database (Open Food Facts, UPC databases)

### Dan Murphy's Integration (Priority: Medium)
- Paste Dan Murphy's product URL
- Auto-extract product details from their website
- Link purchase history via email parsing

---

## 🍸 Recipe Features

### Ingredient Substitutions (Priority: High)
- "You're missing X, but you have Y which could work"
- Claude suggests viable substitutions

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

### Consumption Insights (Priority: Medium)
- Most used spirits
- Seasonal trends
- Cost per drink estimates

### Collection Value (Priority: Low)
- Estimated total value
- Track price appreciation for premium bottles

---

## 🔗 Integrations

### Smart Home (Priority: Low)
- "Hey Siri, what can I make with what's in my bar?"
- Home Assistant integration

### Social Features (Priority: Low)
- Share your bar with friends
- Collaborative cocktail nights

---

## Technical Debt / Improvements

### Image Optimization (Priority: High)
- Compress images before sending to API
- Reduce API costs and latency

### Offline Support (Priority: Medium)
- Cache recipe database
- Queue bottle additions for later sync

### PWA Enhancements (Priority: Medium)
- Install prompt
- Push notifications for low stock

---

*Last updated: December 2024*
