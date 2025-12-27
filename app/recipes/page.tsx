"use client";

import { useState, useEffect } from "react";

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
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bottleCount, setBottleCount] = useState(0);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);

  useEffect(() => {
    fetchRecipes();
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

  // Group recipes by category
  const groupedRecipes = recipes.reduce((acc, recipe) => {
    if (!acc[recipe.category]) {
      acc[recipe.category] = [];
    }
    acc[recipe.category].push(recipe);
    return acc;
  }, {} as Record<string, Recipe[]>);

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
        <button
          onClick={fetchRecipes}
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-neutral-900 font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

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
      {!loading && !error && recipes.length === 0 && (
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

      {/* Recipe Groups */}
      {!loading && !error && recipes.length > 0 && (
        <div className="space-y-10">
          {(["can_make", "almost", "need_shopping"] as const).map((category) => {
            const categoryRecipes = groupedRecipes[category];
            if (!categoryRecipes || categoryRecipes.length === 0) return null;

            return (
              <section key={category}>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-neutral-200">
                    {categoryLabels[category].label}
                  </h2>
                  <p className="text-neutral-500 text-sm">
                    {categoryLabels[category].description}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {categoryRecipes.map((recipe) => (
                    <div
                      key={recipe.name}
                      className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800/50 transition-colors"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
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

                      {/* Ingredients */}
                      <div className="space-y-2 mb-4">
                        {recipe.ingredients.map((ing, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-sm"
                          >
                            {ing.have === true && (
                              <span className="text-green-400">✓</span>
                            )}
                            {ing.have === false && (
                              <span className="text-red-400">✗</span>
                            )}
                            {ing.have === null && (
                              <span className="text-neutral-500">○</span>
                            )}
                            <span
                              className={
                                ing.have === false
                                  ? "text-neutral-500"
                                  : "text-neutral-300"
                              }
                            >
                              {ing.amount} {ing.item}
                            </span>
                            {ing.have === false && ing.isSpirit && (
                              <span className="text-xs text-red-400/70">(need)</span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Expand/Collapse Instructions */}
                      <button
                        onClick={() =>
                          setExpandedRecipe(
                            expandedRecipe === recipe.name ? null : recipe.name
                          )
                        }
                        className="text-amber-500 hover:text-amber-400 text-sm font-medium"
                      >
                        {expandedRecipe === recipe.name
                          ? "Hide Instructions ▲"
                          : "View Instructions ▼"}
                      </button>

                      {/* Instructions (expanded) */}
                      {expandedRecipe === recipe.name && (
                        <div className="mt-4 pt-4 border-t border-neutral-800">
                          <p className="text-neutral-300 text-sm leading-relaxed">
                            {recipe.instructions}
                          </p>
                        </div>
                      )}
                    </div>
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
