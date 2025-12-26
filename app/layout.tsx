import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Liquor Cabinet",
  description: "AI-powered home bar inventory and cocktail assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-neutral-950 text-neutral-100`}
      >
        <div className="flex min-h-screen flex-col">
          {/* Navigation */}
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
              </div>
            </nav>
          </header>

          {/* Main content */}
          <main className="flex-1">{children}</main>

          {/* Footer */}
          <footer className="border-t border-neutral-800 bg-neutral-900/50 py-6">
            <div className="container mx-auto px-4 text-center text-sm text-neutral-500">
              <p>Liquor Cabinet — AI-powered home bar management</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
