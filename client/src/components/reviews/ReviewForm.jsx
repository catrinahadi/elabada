import { useState } from "react";
import { Star, X, Camera } from "lucide-react";

export default function ReviewForm({ shopId, userId, onSubmit, onCancel }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) { alert("Please select a rating."); return; }
    onSubmit({ shopId, userId, rating, comment });
    setRating(0);
    setComment("");
  };

  const active = hovered || rating;

  const LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">Write a Review</h3>
          <p className="text-xs text-gray-500 mt-0.5">Share your experience</p>
        </div>
        <button type="button" onClick={onCancel}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Stars */}
      <div className="flex flex-col items-center gap-2 py-3 bg-gray-50 rounded-xl">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="transition-transform hover:scale-110 active:scale-95 p-0.5"
            >
              <Star
                className={`w-8 h-8 transition-colors ${star <= active
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-300"
                  }`}
              />
            </button>
          ))}
        </div>
        <span className={`text-sm font-medium transition-all duration-200 ${active ? "text-amber-600" : "text-gray-400"
          }`}>
          {active ? LABELS[active] : "Tap to rate"}
        </span>
      </div>

      {/* Comment */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
          Your Experience
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="What did you like or dislike? Was the service fast? Were the staff friendly?"
          className="input resize-none text-sm"
          rows={4}
          maxLength={1000}
        />
        <div className="flex justify-end mt-1">
          <span className="text-xs text-gray-400">{comment.length}/1000</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 text-sm">
          Cancel
        </button>
        <button
          type="submit"
          disabled={rating === 0}
          className="btn-primary flex-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Review
        </button>
      </div>
    </form>
  );
}
