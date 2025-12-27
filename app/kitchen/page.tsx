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

export default function KitchenPage() {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useMetric, setUseMetric] = useState(config.units.default === "metric");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for voice support
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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

  const handleSearchWithQuery = async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recipes/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setRecipe(data.recipe);
      } else {
        setError(data.error || "Recipe not found");
        setRecipe(null);
      }
    } catch (err) {
      setError("Failed to search");
      setRecipe(null);
    } finally {
      setLoading(false);
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

  const clearRecipe = () => {
    setRecipe(null);
    setSearchQuery("");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-amber-500">🍸 Kitchen Mode</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setUseMetric(!useMetric)}
            className="px-4 py-2 text-lg border border-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-800"
          >
            {useMetric ? "ml" : "oz"}
          </button>
          <a
            href="/recipes"
            className="px-4 py-2 text-lg text-neutral-400 hover:text-neutral-200"
          >
            ← Back
          </a>
        </div>
      </div>

      {/* Search Bar - Large */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What cocktail do you want to make?"
              className="w-full px-6 py-4 text-2xl bg-neutral-900 border-2 border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Voice Button - Large */}
          {voiceSupported && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`px-6 py-4 text-2xl rounded-xl transition-colors ${
                isListening
                  ? "bg-red-500 hover:bg-red-600 text-white min-w-[180px]"
                  : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-2 border-neutral-700"
              }`}
            >
              {isListening ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  Listening...
                </span>
              ) : (
                "🎤"
              )}
            </button>
          )}

          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="px-8 py-4 text-2xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-neutral-900 font-bold rounded-xl"
          >
            {loading ? "..." : "Go"}
          </button>
        </form>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-3xl text-red-400 mb-4">{error}</p>
          <button
            onClick={clearRecipe}
            className="text-xl text-amber-500 hover:text-amber-400"
          >
            Try another search
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-24">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-3xl text-neutral-400">Finding recipe...</p>
        </div>
      )}

      {/* Empty State */}
      {!recipe && !loading && !error && (
        <div className="text-center py-24">
          <div className="text-8xl mb-6">🍸</div>
          <p className="text-3xl text-neutral-400 mb-4">
            Search for a cocktail
          </p>
          <p className="text-xl text-neutral-500">
            Tap 🎤 and say a cocktail name, or type to search
          </p>
        </div>
      )}

      {/* Recipe Display - Large Format */}
      {recipe && !loading && (
        <div className="max-w-4xl mx-auto">
          {/* Recipe Header */}
          <div className="text-center mb-8">
            <h2 className="text-5xl font-bold text-white mb-2">{recipe.name}</h2>
            <p className="text-2xl text-neutral-400">
              {recipe.glassType} • {recipe.garnish}
            </p>
            <div className="mt-4">
              {recipe.category === "can_make" ? (
                <span className="inline-block px-4 py-2 text-xl bg-green-500/20 text-green-400 rounded-full">
                  ✓ You can make this!
                </span>
              ) : recipe.category === "almost" ? (
                <span className="inline-block px-4 py-2 text-xl bg-yellow-500/20 text-yellow-400 rounded-full">
                  Missing 1 spirit
                </span>
              ) : (
                <span className="inline-block px-4 py-2 text-xl bg-red-500/20 text-red-400 rounded-full">
                  Missing {recipe.missingSpirits} spirits
                </span>
              )}
            </div>
          </div>

          {/* Image + Ingredients Side by Side */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Image */}
            {recipe.imageUrl && (
              <div className="flex items-center justify-center">
                <img
                  src={recipe.imageUrl}
                  alt={recipe.name}
                  className="w-full max-w-sm rounded-2xl shadow-2xl"
                />
              </div>
            )}

            {/* Ingredients - Large */}
            <div className={recipe.imageUrl ? "" : "md:col-span-2"}>
              <h3 className="text-2xl font-semibold text-amber-500 mb-4">
                Ingredients
              </h3>
              <div className="space-y-4">
                {recipe.ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 text-2xl"
                  >
                    {ing.have === true && (
                      <span className="text-green-400 text-3xl">✓</span>
                    )}
                    {ing.have === false && (
                      <span className="text-red-400 text-3xl">✗</span>
                    )}
                    {ing.have === null && (
                      <span className="text-neutral-500 text-3xl">○</span>
                    )}
                    <span
                      className={
                        ing.have === false ? "text-neutral-500" : "text-white"
                      }
                    >
                      <span className="font-semibold">
                        {convertMeasure(ing.amount, useMetric)}
                      </span>{" "}
                      {ing.item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Instructions - Large */}
          <div className="bg-neutral-900/50 rounded-2xl p-8 mb-8">
            <h3 className="text-2xl font-semibold text-amber-500 mb-4">
              Instructions
            </h3>
            <p className="text-2xl text-neutral-200 leading-relaxed">
              {recipe.instructions}
            </p>
          </div>

          {/* Clear Button */}
          <div className="text-center">
            <button
              onClick={clearRecipe}
              className="px-8 py-4 text-xl text-neutral-400 hover:text-white border border-neutral-700 rounded-xl hover:bg-neutral-800"
            >
              Search Another Cocktail
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
