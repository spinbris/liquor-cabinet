"use client";

import { useState, useEffect } from "react";

interface Stats {
  totalBottles: number;
  categories: number;
  cocktailsAvailable: number | null;
  finishedThisMonth: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.stats);
      })
      .catch(err => console.error("Failed to load stats:", err));
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          Your Personal Bar Assistant
        </h1>
        <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
          Photograph your bottles within app on your phone, track your inventory, 
          and discover cocktails you can make with what you have on hand.
        </p>
      </section>

      {/* Quick Actions */}
      <section className="grid md:grid-cols-3 gap-6 mb-16">
        <a
          href="/add"
          className="group p-8 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800/50 hover:border-amber-600/50 transition-all no-underline"
        >
          <div className="text-4xl mb-4">📸</div>
          <h2 className="text-xl font-semibold mb-2 text-neutral-100 group-hover:text-amber-400 transition-colors">
            Add Bottle
          </h2>
          <p className="text-neutral-400">
            Snap a photo and let AI identify your bottle automatically.
          </p>
        </a>

        <a
          href="/inventory"
          className="group p-8 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800/50 hover:border-amber-600/50 transition-all no-underline"
        >
          <div className="text-4xl mb-4">🗄️</div>
          <h2 className="text-xl font-semibold mb-2 text-neutral-100 group-hover:text-amber-400 transition-colors">
            View Inventory
          </h2>
          <p className="text-neutral-400">
            Browse your collection by category, search, and manage stock.
          </p>
        </a>

        <a
          href="/recipes"
          className="group p-8 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800/50 hover:border-amber-600/50 transition-all no-underline"
        >
          <div className="text-4xl mb-4">🍸</div>
          <h2 className="text-xl font-semibold mb-2 text-neutral-100 group-hover:text-amber-400 transition-colors">
            Find Recipes
          </h2>
          <p className="text-neutral-400">
            Discover cocktails you can make right now with your bottles.
          </p>
        </a>
      </section>

      {/* Stats Section */}
      <section className="p-8 rounded-xl border border-neutral-800 bg-neutral-900/30">
        <h2 className="text-2xl font-semibold mb-6 text-center text-neutral-100">
          Cabinet Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-4xl font-bold text-amber-500">
              {stats?.totalBottles ?? "—"}
            </div>
            <div className="text-neutral-400">Total Bottles</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-amber-500">
              {stats?.categories ?? "—"}
            </div>
            <div className="text-neutral-400">Categories</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-amber-500">—</div>
            <div className="text-neutral-400">Cocktails Available</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-amber-500">
              {stats?.finishedThisMonth ?? "—"}
            </div>
            <div className="text-neutral-400">Finished This Month</div>
          </div>
        </div>
      </section>
    </div>
  );
}
