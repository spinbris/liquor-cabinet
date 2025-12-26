"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { BottleIdentification, IdentifyResponse } from "@/lib/types";

export default function AddBottlePage() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<BottleIdentification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
        setSuccess(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdentify = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });

      const data: IdentifyResponse = await response.json();

      if (data.success && data.bottle) {
        setResult(data.bottle);
      } else {
        setError(data.error || "Failed to identify bottle");
      }
    } catch (err) {
      setError("Failed to connect to identification service");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCabinet = async () => {
    if (!result) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/bottles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: result.brand,
          product_name: result.productName,
          category: result.category,
          sub_category: result.subCategory || null,
          country_of_origin: result.countryOfOrigin || null,
          region: result.region || null,
          abv: result.abv || null,
          size_ml: result.sizeMl || null,
          description: result.description || null,
          tasting_notes: result.tastingNotes || null,
          image_url: image, // Store the base64 image for now
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Reset after short delay to show success
        setTimeout(() => {
          router.push("/inventory");
        }, 1500);
      } else {
        setError(data.error || "Failed to add bottle");
      }
    } catch (err) {
      setError("Failed to save bottle to cabinet");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setResult(null);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-2 text-neutral-100">Add Bottle</h1>
      <p className="text-neutral-400 mb-8">
        Upload a photo of your bottle and let AI identify it automatically.
      </p>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-green-400 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Bottle added to your cabinet! Redirecting...
          </p>
        </div>
      )}

      {/* Upload Area */}
      {!image && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-neutral-700 rounded-xl p-12 text-center cursor-pointer hover:border-amber-500/50 hover:bg-neutral-900/50 transition-all"
        >
          <div className="text-5xl mb-4">📸</div>
          <p className="text-neutral-300 mb-2">Click to upload a photo</p>
          <p className="text-neutral-500 text-sm">or drag and drop</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Image Preview */}
      {image && !result && (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-neutral-900">
            <img
              src={image}
              alt="Bottle preview"
              className="w-full h-auto max-h-96 object-contain"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleIdentify}
              disabled={loading}
              className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-neutral-900 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
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
                  Identifying...
                </span>
              ) : (
                "Identify Bottle"
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={loading}
              className="px-6 py-3 border border-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
          <button
            onClick={handleReset}
            className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Results */}
      {result && !success && (
        <div className="space-y-6">
          {/* Image thumbnail */}
          <div className="flex gap-4 items-start">
            <img
              src={image!}
              alt="Bottle"
              className="w-24 h-32 object-cover rounded-lg"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-neutral-100">
                  {result.brand}
                </h2>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    result.confidence === "high"
                      ? "bg-green-500/20 text-green-400"
                      : result.confidence === "medium"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {result.confidence} confidence
                </span>
              </div>
              <p className="text-neutral-300">{result.productName}</p>
              <p className="text-neutral-500 text-sm capitalize">
                {result.subCategory || result.category}
                {result.countryOfOrigin && ` • ${result.countryOfOrigin}`}
                {result.region && ` (${result.region})`}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {result.abv && (
              <div className="p-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
                <p className="text-neutral-500 text-sm">ABV</p>
                <p className="text-neutral-100 text-lg font-semibold">
                  {result.abv}%
                </p>
              </div>
            )}
            {result.sizeMl && (
              <div className="p-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
                <p className="text-neutral-500 text-sm">Size</p>
                <p className="text-neutral-100 text-lg font-semibold">
                  {result.sizeMl}ml
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          {result.description && (
            <div className="p-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
              <p className="text-neutral-500 text-sm mb-1">Description</p>
              <p className="text-neutral-300">{result.description}</p>
            </div>
          )}

          {/* Tasting Notes */}
          {result.tastingNotes && (
            <div className="p-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
              <p className="text-neutral-500 text-sm mb-1">Tasting Notes</p>
              <p className="text-neutral-300">{result.tastingNotes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleAddToCabinet}
              disabled={saving}
              className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-neutral-900 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
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
                  Adding...
                </span>
              ) : (
                "Add to Cabinet"
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={saving}
              className="px-6 py-3 border border-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              Scan Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
