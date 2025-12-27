"use client";

import { useState, useEffect } from "react";
import { Bottle } from "@/lib/database.types";

export default function InventoryPage() {
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBottles();
  }, []);

  const fetchBottles = async () => {
    try {
      const response = await fetch("/api/bottles");
      const data = await response.json();

      if (data.success) {
        setBottles(data.bottles);
      } else {
        setError(data.error || "Failed to load inventory");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  // Group bottles by category
  const groupedBottles = bottles.reduce((acc, bottle) => {
    const category = bottle.category || "other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(bottle);
    return acc;
  }, {} as Record<string, Bottle[]>);

  const categoryLabels: Record<string, string> = {
    whisky: "🥃 Whisky",
    gin: "🍸 Gin",
    rum: "🏝️ Rum",
    vodka: "🧊 Vodka",
    tequila: "🌵 Tequila",
    brandy: "🍷 Brandy",
    liqueur: "🍹 Liqueur",
    wine: "🍷 Wine",
    beer: "🍺 Beer",
    other: "🍾 Other",
  };

  // Calculate total bottles (sum of quantities)
  const totalBottles = bottles.reduce((sum, b) => sum + b.quantity, 0);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-100">Inventory</h1>
          <p className="text-neutral-400">
            {totalBottles} bottle{totalBottles !== 1 ? "s" : ""} in your cabinet
            {bottles.length !== totalBottles && ` (${bottles.length} unique)`}
          </p>
        </div>
        <a
          href="/add"
          className="bg-amber-500 hover:bg-amber-600 text-neutral-900 font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          + Add Bottle
        </a>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2 text-neutral-400">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
            Loading inventory...
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && bottles.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🗄️</div>
          <h2 className="text-xl font-semibold text-neutral-300 mb-2">
            Your cabinet is empty
          </h2>
          <p className="text-neutral-500 mb-6">
            Add your first bottle to get started
          </p>
          <a
            href="/add"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-neutral-900 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Add Your First Bottle
          </a>
        </div>
      )}

      {/* Inventory Grid by Category */}
      {!loading && !error && bottles.length > 0 && (
        <div className="space-y-10">
          {Object.entries(groupedBottles).map(([category, categoryBottles]) => (
            <section key={category}>
              <h2 className="text-xl font-semibold text-neutral-200 mb-4">
                {categoryLabels[category] || category}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categoryBottles.map((bottle) => (
                  <a
                    href={`/inventory/${bottle.id}`}
                    key={bottle.id}
                    className="relative p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800/50 hover:border-amber-500/50 transition-colors cursor-pointer block"
                  >
                    {/* Quantity Badge */}
                    {bottle.quantity > 1 && (
                      <div className="absolute top-2 right-2 bg-amber-500 text-neutral-900 text-sm font-bold px-2 py-0.5 rounded-full">
                        ×{bottle.quantity}
                      </div>
                    )}

                    {/* Bottle Image */}
                    {bottle.image_url ? (
                      <img
                        src={bottle.image_url}
                        alt={bottle.product_name}
                        className="w-full h-32 object-contain rounded-lg mb-3 bg-neutral-800"
                      />
                    ) : (
                      <div className="w-full h-32 rounded-lg mb-3 bg-neutral-800 flex items-center justify-center text-4xl">
                        🍾
                      </div>
                    )}

                    {/* Bottle Info */}
                    <h3 className="font-semibold text-neutral-100 truncate">
                      {bottle.brand}
                    </h3>
                    <p className="text-sm text-neutral-400 truncate">
                      {bottle.product_name}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-neutral-500 capitalize">
                        {bottle.sub_category || bottle.category}
                      </span>
                      {bottle.abv && (
                        <span className="text-xs text-amber-500">
                          {bottle.abv}%
                        </span>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
