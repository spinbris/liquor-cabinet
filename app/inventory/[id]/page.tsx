"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Bottle } from "@/lib/database.types";

export default function BottleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [bottle, setBottle] = useState<Bottle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchBottle();
  }, [params.id]);

  const fetchBottle = async () => {
    try {
      const response = await fetch(`/api/bottles/${params.id}`);
      const data = await response.json();
      if (data.success) {
        setBottle(data.bottle);
      } else {
        setError(data.error || "Bottle not found");
      }
    } catch (err) {
      setError("Failed to load bottle");
    } finally {
      setLoading(false);
    }
  };

  const handleFinishOne = async () => {
    if (!bottle || bottle.quantity <= 0) return;
    setUpdating(true);
    try {
      const response = await fetch(`/api/bottles/${params.id}/finish`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setBottle(data.bottle);
        if (data.bottle.quantity === 0) {
          router.push("/inventory");
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to update");
    } finally {
      setUpdating(false);
    }
  };

  const handleAddOne = async () => {
    if (!bottle) return;
    setUpdating(true);
    try {
      const response = await fetch(`/api/bottles/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: bottle.quantity + 1,
          event_type: "added",
          quantity_change: 1,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setBottle(data.bottle);
      }
    } catch (err) {
      setError("Failed to update");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/bottles/${params.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        router.push("/inventory");
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to delete");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (error || !bottle) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error || "Bottle not found"}</p>
        </div>
        <a href="/inventory" className="text-amber-500 hover:text-amber-400 mt-4 inline-block">
          ← Back to Inventory
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      {/* Back link */}
      <a href="/inventory" className="text-neutral-400 hover:text-amber-500 mb-6 inline-block">
        ← Back to Inventory
      </a>

      {/* Header with image */}
      <div className="flex gap-6 mb-8">
        {bottle.image_url ? (
          <img
            src={bottle.image_url}
            alt={bottle.product_name}
            className="w-32 h-44 object-contain rounded-lg bg-neutral-800"
          />
        ) : (
          <div className="w-32 h-44 rounded-lg bg-neutral-800 flex items-center justify-center text-5xl">
            🍾
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-100">{bottle.brand}</h1>
              <p className="text-xl text-neutral-300">{bottle.product_name}</p>
              <p className="text-neutral-500 capitalize">
                {bottle.sub_category || bottle.category}
                {bottle.country_of_origin && ` • ${bottle.country_of_origin}`}
                {bottle.region && ` (${bottle.region})`}
              </p>
            </div>
            <div className="text-3xl font-bold text-amber-500">
              ×{bottle.quantity}
            </div>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {bottle.abv && (
          <div className="p-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
            <p className="text-neutral-500 text-sm">ABV</p>
            <p className="text-neutral-100 text-lg font-semibold">{bottle.abv}%</p>
          </div>
        )}
        {bottle.size_ml && (
          <div className="p-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
            <p className="text-neutral-500 text-sm">Size</p>
            <p className="text-neutral-100 text-lg font-semibold">{bottle.size_ml}ml</p>
          </div>
        )}
      </div>

      {/* Description */}
      {bottle.description && (
        <div className="p-4 bg-neutral-900/50 rounded-lg border border-neutral-800 mb-4">
          <p className="text-neutral-500 text-sm mb-1">Description</p>
          <p className="text-neutral-300">{bottle.description}</p>
        </div>
      )}

      {/* Tasting Notes */}
      {bottle.tasting_notes && (
        <div className="p-4 bg-neutral-900/50 rounded-lg border border-neutral-800 mb-8">
          <p className="text-neutral-500 text-sm mb-1">Tasting Notes</p>
          <p className="text-neutral-300">{bottle.tasting_notes}</p>
        </div>
      )}

      {/* Quantity Controls */}
      <div className="p-6 bg-neutral-900/50 rounded-lg border border-neutral-800 mb-6">
        <p className="text-neutral-400 text-sm text-center mb-3">Quantity in Stock</p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleFinishOne}
            disabled={updating || bottle.quantity <= 0}
            className="w-12 h-12 rounded-full border border-neutral-700 text-neutral-300 hover:bg-neutral-800 disabled:opacity-50 text-xl font-bold"
          >
            −
          </button>
          <span className="text-4xl font-bold text-neutral-100 w-16 text-center">
            {bottle.quantity}
          </span>
          <button
            onClick={handleAddOne}
            disabled={updating}
            className="w-12 h-12 rounded-full border border-neutral-700 text-neutral-300 hover:bg-neutral-800 disabled:opacity-50 text-xl font-bold"
          >
            +
          </button>
        </div>
      </div>

      {/* Mark as Finished button */}
      <button
        onClick={handleFinishOne}
        disabled={updating || bottle.quantity <= 0}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-neutral-900 font-semibold py-3 px-6 rounded-lg transition-colors mb-6"
      >
        {updating ? "Updating..." : "Mark One as Finished"}
      </button>

      {/* Secondary actions */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex-1 py-2 px-4 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
        >
          Delete Entry
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-semibold text-neutral-100 mb-2">Delete this bottle?</h3>
            <p className="text-neutral-400 mb-6">
              This will permanently remove &quot;{bottle.brand} {bottle.product_name}&quot; from your inventory. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 px-4 border border-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={updating}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {updating ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
