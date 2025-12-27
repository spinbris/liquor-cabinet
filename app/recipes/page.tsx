"use client";

import { useState, useEffect, useRef } from "react";
import { config } from "@/lib/config";

interface RecipeIngredient {
  item: string;
  amount: string;
  isSpirit: boolean;
  have: boolean | null;
}

interface Recipe {
  name: string;
  difficulty: "easy" | "medium" | "hard";
  ingredients: RecipeIngredient[];
  instructions: string;
  glassType: string;
  garnish: string;
  missingSpirits: number;
  category: "can_make" | "almost" | "need_shopping";
  imageUrl: string | null;
}

// Convert imperial to metric measurements
function convertMeasure(amount: string, toMetric: boolean): string {
  if (!toMetric) return amount;

  let result = amount.replace(/(\d+\.?\d*)\s*oz/gi, (match, num) => {
    const ml = Math.round(parseFloat(num) * 30);
    return `${ml}ml`;
  });

  result = result.replace(/(\d+\.?\d*)\s*cups?/gi, (match, num) => {
    const ml = Math.round(parseFloat(num) * 240);
    return `${ml}ml`;
  });

  result = result.replace(/(\d+\.?\d*)\s*(tbsp|tablespoons?)/gi, (match, num) => {
    const ml = Math.round(parseFloat(num) * 15);
    return `${ml}ml`;
  });

  result = result.replace(/(\d+\.?\d*)\s*(tsp|teaspoons?)/gi, (match, num) => {
    const ml = Math.round(parseFloat(num) * 5);
    return `${ml}ml`;
  });

  return result;
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bottleCount, setBottleCount] = useState(0);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [useMetric, setUseMetric] = useState(config.units.default === "metric");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<Recipe | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    fetchRecipes();
    
    // Check for voice support
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setVoiceSupported(true);
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "en-AU";

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setSearchQuery(transcript);
          setIsListening(false);
          // Auto-search after voice input
          handleSearchWithQuery(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const fetchRecipes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/recipes");
      const data = await response.json();

      if (data.success) {
        setRecipes(data.recipes);
        setBottleCount(data.bottleCount || 0);
      } else {
        setError(data.error || "Failed to load recipes");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchWithQuery = async (query: string) => {
    if (!query.trim()) return;

    setSearching(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      const response = await fetch("/api/recipes/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setSearchResult(data.recipe);
        setExpandedRecipe(data.recipe.name);
      } else {
        setSearchError(data.error || "Recipe not found");
      }
    } catch (err) {
      setSearchError("Failed to search");
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    handleSearchWithQuery(searchQuery);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResult(null);
    setSearchError(null);
  };

  const difficultyColor = {
    easy: "bg-green-500/20 text-green-400",
    medium: "bg-yellow-500/20 text-yellow-400",
    hard: "bg-red-500/20 text-red-400",
  };

  const categoryLabels = {
    can_make: { label: "🎉 Ready to Make", description: "You have all the spirits!" },
    almost: { label: "🛒 Almost There", description: "Just missing one spirit" },
    need_shopping: { label: "📝 Shopping List", description: "Need a few more bottles" },
  };

  const groupedRecipes = recipes.reduce((acc, recipe) => {
    if (!acc[recipe.category]) {
      acc[recipe.category] = [];
    }
    acc[recipe.category].push(recipe);
    return acc;
  }, {} as Record<string, Recipe[]>);

  // Render a single recipe card
  const RecipeCard = ({ recipe }: { recipe: Recipe }) => (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800/50 transition-colors overflow-hidden">
      {recipe.imageUrl ? (
        <div className="relative h-48 bg-neutral-800">
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="text-xl font-semibold text-white drop-shadow-lg">
              {recipe.name}
            </h3>
            <p className="text-neutral-300 text-sm drop-shadow">
              {recipe.glassType} • {recipe.garnish}
            </p>
          </div>
          <span
            className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-full ${difficultyColor[recipe.difficulty]}`}
          >
            {recipe.difficulty}
          </span>
        </div>
      ) : (
        <div className="p-4 pb-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-xl font-semibold text-neutral-100">
                {recipe.name}
              </h3>
              <p className="text-neutral-500 text-sm">
                {recipe.glassType} • {recipe.garnish}
              </p>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full ${difficultyColor[recipe.difficulty]}`}
            >
              {recipe.difficulty}
            </span>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="space-y-2 mb-4">
          {recipe.ingredients.map((ing, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              {ing.have === true && <span className="text-green-400">✓</span>}
              {ing.have === false && <span className="text-red-400">✗</span>}
              {ing.have === null && <span className="text-neutral-500">○</span>}
              <span
                className={ing.have === false ? "text-neutral-500" : "text-neutral-300"}
              >
                {convertMeasure(ing.amount, useMetric)} {ing.item}
              </span>
              {ing.have === false && ing.isSpirit && (
                <span className="text-xs text-red-400/70">(need)</span>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() =>
            setExpandedRecipe(expandedRecipe === recipe.name ? null : recipe.name)
          }
          className="text-amber-500 hover:text-amber-400 text-sm font-medium"
        >
          {expandedRecipe === recipe.name
            ? "Hide Instructions ▲"
            : "View Instructions ▼"}
        </button>

        {expandedRecipe === recipe.name && (
          <div className="mt-4 pt-4 border-t border-neutral-800">
            <p className="text-neutral-300 text-sm leading-relaxed">
              {recipe.instructions}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-100">🍸 Cocktail Recipes</h1>
          <p className="text-neutral-400">
            {bottleCount > 0
              ? `Based on your ${bottleCount} bottle${bottleCount !== 1 ? "s" : ""}`
              : "Add bottles to get personalized suggestions"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/kitchen"
            className="px-3 py-2 border border-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium"
            title="Kitchen Mode - large display for casting"
          >
            📺 Kitchen
          </a>
          <button
            onClick={() => setUseMetric(!useMetric)}
            className="px-3 py-2 border border-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium"
            title="Toggle units"
          >
            {useMetric ? "ml" : "oz"} ⟷ {useMetric ? "oz" : "ml"}
          </button>
          <button
            onClick={fetchRecipes}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-neutral-900 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Search Bar with Voice */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a cocktail... (e.g., Garibaldi, Negroni)"
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
              >
                ✕
              </button>
            )}
          </div>
          
          {/* Voice Button */}
          {voiceSupported && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`px-4 py-3 rounded-lg transition-colors ${
                isListening
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700"
              }`}
              title={isListening ? "Stop listening" : "Voice search"}
            >
              {isListening ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Listening...
                </span>
              ) : (
                "🎤"
              )}
            </button>
          )}
          
          <button
            type="submit"
            disabled={searching || !searchQuery.trim()}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-neutral-900 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </form>
        
        {/* Voice hint */}
        {voiceSupported && !isListening && (
          <p className="text-neutral-500 text-xs mt-2">
            💡 Tap 🎤 and say a cocktail name
          </p>
        )}
      </div>

      {/* Search Error */}
      {searchError && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{searchError}</p>
          <button
            onClick={clearSearch}
            className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Search Result */}
      {searchResult && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-neutral-200">
                🔍 Search Result
              </h2>
              <p className="text-neutral-500 text-sm">
                {searchResult.category === "can_make"
                  ? "You can make this!"
                  : searchResult.category === "almost"
                  ? "You're missing 1 spirit"
                  : `You're missing ${searchResult.missingSpirits} spirits`}
              </p>
            </div>
            <button
              onClick={clearSearch}
              className="px-3 py-1 text-neutral-400 hover:text-neutral-200 text-sm"
            >
              Clear
            </button>
          </div>
          <div className="max-w-md">
            <RecipeCard recipe={searchResult} />
          </div>
        </div>
      )}

      {/* Divider if search result shown */}
      {searchResult && recipes.length > 0 && (
        <hr className="border-neutral-800 mb-10" />
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-16">
          <div className="inline-flex items-center gap-3 text-neutral-400">
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>Finding recipes based on your bottles...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchRecipes}
            className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && recipes.length === 0 && !searchResult && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🍾</div>
          <h2 className="text-xl font-semibold text-neutral-300 mb-2">
            No bottles yet
          </h2>
          <p className="text-neutral-500 mb-6">
            Add some bottles to your cabinet to get cocktail suggestions
          </p>
          <a
            href="/add"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-neutral-900 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Add Your First Bottle
          </a>
        </div>
      )}

      {/* Suggestions heading */}
      {!loading && !error && recipes.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-neutral-200">
            ✨ Suggestions Based on Your Inventory
          </h2>
          <p className="text-neutral-500 text-sm">
            Cocktails you can make with what you have
          </p>
        </div>
      )}

      {/* Recipe Groups */}
      {!loading && !error && recipes.length > 0 && (
        <div className="space-y-10">
          {(["can_make", "almost", "need_shopping"] as const).map((category) => {
            const categoryRecipes = groupedRecipes[category];
            if (!categoryRecipes || categoryRecipes.length === 0) return null;

            return (
              <section key={category}>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-neutral-300">
                    {categoryLabels[category].label}
                  </h3>
                  <p className="text-neutral-500 text-sm">
                    {categoryLabels[category].description}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {categoryRecipes.map((recipe) => (
                    <RecipeCard key={recipe.name} recipe={recipe} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
