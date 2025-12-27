// Centralized configuration for the Liquor Cabinet app

export const config = {
  // AI Model settings
  ai: {
    // Model for bottle identification (needs vision)
    // Using Haiku for cost efficiency (~10x cheaper than Sonnet)
    identifyModel: "claude-haiku-4-5-20251001",
    
    // Model for recipe generation (text only)
    recipeModel: "claude-haiku-4-5-20251001",
    
    // Token limits
    maxTokens: {
      identify: 1024,
      recipes: 2048,
    },
  },
  
  // Recipe settings
  recipes: {
    // Number of recipes to suggest
    suggestionCount: 8,
    
    // Common mixers that don't count as "missing"
    commonMixers: [
      "soda water",
      "tonic water",
      "cola",
      "ginger beer",
      "ginger ale",
      "lemon juice",
      "lime juice",
      "orange juice",
      "pineapple juice",
      "cranberry juice",
      "grapefruit juice",
      "simple syrup",
      "sugar",
      "honey",
      "egg white",
      "cream",
      "milk",
      "coconut cream",
      "coffee",
      "water",
      "ice",
    ],
  },
  
  // Units preference
  units: {
    // Default measurement system: "metric" (ml) or "imperial" (oz)
    // Set to "metric" for Australia
    default: "metric" as "metric" | "imperial",
  },
};
