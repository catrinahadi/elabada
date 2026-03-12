import { useState } from "react";
import { Star, X, Camera } from "lucide-react";

export default function ReviewForm({ shopId, userId, onSubmit, onCancel }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [wasOnTime, setWasOnTime] = useState(true);
  const [actualTimeTaken, setActualTimeTaken] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) { alert("Please select a rating."); return; }
    onSubmit({ 
      shopId, 
      userId, 
      rating, 
      comment, 
      isAnonymous, 
      wasOnTime, 
      actualTimeTaken: !wasOnTime ? Number(actualTimeTaken) : null 
    });
    setRating(0);
    setComment("");
    setIsAnonymous(false); // Reset isAnonymous after submission
    setWasOnTime(true);
    setActualTimeTaken("");
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

      {/* Turnaround Time Verification */}
      <div className="p-4 bg-gray-50 rounded-xl space-y-3">
        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">
          Turnaround Verification
        </label>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-700">Did the shop follow their promised turnaround time?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setWasOnTime(true)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                wasOnTime 
                  ? "bg-black text-white border-black" 
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              Yes, On Time
            </button>
            <button
              type="button"
              onClick={() => setWasOnTime(false)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                !wasOnTime 
                  ? "bg-red-600 text-white border-red-600" 
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              No, It Was Late
            </button>
          </div>
          
          {!wasOnTime && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">
                How many hours did it actually take?
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={actualTimeTaken}
                  onChange={e => setActualTimeTaken(e.target.value)}
                  placeholder="e.g. 30"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">hrs</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Anonymity Toggle */}
      <div className="flex items-center gap-3 px-1 pb-1">
        <button
          type="button"
          id="post-anonymous"
          onClick={() => setIsAnonymous(!isAnonymous)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
            isAnonymous ? 'bg-black' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
              isAnonymous ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <label htmlFor="post-anonymous" className="text-sm font-medium text-gray-600 cursor-pointer select-none">
          Post Anonymously
        </label>
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
          Post Review
        </button>
      </div>
    </form>
  );
}
