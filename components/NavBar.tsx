"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

export default function NavBar() {
  const [user, setUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  // Don't show nav on auth page
  if (typeof window !== "undefined" && window.location.pathname === "/auth") {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-sm">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <a href="/" className="flex items-center gap-2 no-underline">
          <span className="text-2xl">🥃</span>
          <span className="text-xl font-semibold text-neutral-100">
            Liquor Cabinet
          </span>
        </a>
        <div className="flex items-center gap-6">
          <a
            href="/inventory"
            className="text-neutral-400 hover:text-amber-500 transition-colors no-underline"
          >
            Inventory
          </a>
          <a
            href="/add"
            className="text-neutral-400 hover:text-amber-500 transition-colors no-underline"
          >
            Add Bottle
          </a>
          <a
            href="/recipes"
            className="text-neutral-400 hover:text-amber-500 transition-colors no-underline"
          >
            Recipes
          </a>

          {/* User Menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 text-neutral-400 hover:text-amber-500 transition-colors"
              >
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-neutral-900 font-semibold">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden md:inline text-sm">
                  {user.user_metadata?.full_name || user.email?.split("@")[0]}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    showMenu ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-lg shadow-lg py-1">
                  <div className="px-4 py-2 border-b border-neutral-800">
                    <p className="text-sm text-neutral-300 truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
