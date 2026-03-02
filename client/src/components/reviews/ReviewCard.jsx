import { Star, User } from "lucide-react";

export default function ReviewCard({ review }) {
  return (
    <div className="flex gap-3 py-4 border-b border-gray-100 last:border-0">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
        <User className="w-4 h-4 text-gray-400" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Name + date row */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {review.reviewerName || "Anonymous"}
          </p>
          {review.createdAt && (
            <span className="text-xs text-gray-400 flex-shrink-0">
              {new Date(review.createdAt).toLocaleDateString("en-PH", {
                month: "short", day: "numeric", year: "numeric"
              })}
            </span>
          )}
        </div>

        {/* Stars */}
        <div className="flex gap-0.5 mt-1 mb-2">
          {[1, 2, 3, 4, 5].map(s => (
            <Star
              key={s}
              className={`w-3.5 h-3.5 ${s <= review.rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-200"
                }`}
            />
          ))}
        </div>

        {/* Comment */}
        <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
      </div>
    </div>
  );
}
