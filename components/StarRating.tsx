'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // e.g., 4.8
  size?: number; // size of stars
  showEmpty?: boolean; // show empty stars for remaining
}

/**
 * StarRating component with partial star fill
 * Shows stars with accurate partial filling based on decimal rating
 * 
 * Examples:
 * - rating: 4.8 → 4 full stars + 1 star filled 80%
 * - rating: 3.2 → 3 full stars + 1 star filled 20%
 */
export default function StarRating({ rating, size = 16, showEmpty = true }: StarRatingProps) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const partialStar = rating % 1;

  // Render full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <Star
        key={`full-${i}`}
        size={size}
        className="fill-yellow-400 text-yellow-400"
      />
    );
  }

  // Render partial star if exists
  if (partialStar > 0 && fullStars < 5) {
    const percentage = Math.round(partialStar * 100);
    stars.push(
      <div key="partial" className="relative" style={{ width: size, height: size }}>
        {/* Empty star background */}
        <Star
          size={size}
          className="text-gray-300 absolute inset-0"
        />
        {/* Filled star with clip */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${percentage}%` }}
        >
          <Star
            size={size}
            className="fill-yellow-400 text-yellow-400"
          />
        </div>
      </div>
    );
  }

  // Render empty stars if needed
  if (showEmpty) {
    const emptyCount = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyCount; i++) {
      stars.push(
        <Star
          key={`empty-${i}`}
          size={size}
          className="text-gray-300"
        />
      );
    }
  }

  return <div className="flex gap-0.5">{stars}</div>;
}
