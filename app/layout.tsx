import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Providers from "@/components/Providers";

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
        <Providers>
          <div className="flex min-h-screen flex-col">
            {/* Navigation */}
            <NavBar />

            {/* Main content */}
            <main className="flex-1">{children}</main>

            {/* Footer */}
            <footer className="border-t border-neutral-800 bg-neutral-900/50 py-6">
              <div className="container mx-auto px-4 text-center text-sm text-neutral-500">
                <p>Liquor Cabinet — AI-powered home bar management</p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
