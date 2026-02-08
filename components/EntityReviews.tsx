'use client';

import { Star } from 'lucide-react';
import StarRating from './StarRating';

interface EntityReviewsProps {
  entity: {
    totalScore?: number;
    reviewsCount?: number;
    reviews?: Array<{
      name?: string;
      stars?: number;
      text?: string;
      textTranslated?: string;
      publishedAtDate?: string;
      created_at?: string;
    }>;
  };
}

export default function EntityReviews({ entity }: EntityReviewsProps) {
  const rating = Number(entity.totalScore || 0);
  const reviewCount = entity.reviewsCount || 0;
  const reviews = entity.reviews || [];

  // Don't render if no rating
  if (!rating && reviewCount === 0) return null;

  // Calculate rating distribution (5 stars to 1 star)
  const getRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0]; // [5★, 4★, 3★, 2★, 1★]
    
    reviews.forEach(review => {
      const stars = review.stars || 0;
      if (stars >= 1 && stars <= 5) {
        distribution[5 - stars]++; // Reverse index: 5★ at index 0
      }
    });
    
    return distribution;
  };

  const distribution = getRatingDistribution();

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Сегодня';
      if (diffDays === 1) return 'Вчера';
      if (diffDays < 7) return `${diffDays} дней назад`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} недель назад`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} месяцев назад`;
      return `${Math.floor(diffDays / 365)} лет назад`;
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="bg-gray-50 px-5 py-4">
      {/* Section title */}
      <h2 className="text-gray-900 font-semibold text-sm mb-4">
        💬 Рейтинг и отзывы
      </h2>
      
      {/* Rating summary */}
      <div className="flex items-start gap-6 mb-6">
        {/* Big rating number - more prominent */}
        <div className="flex flex-col items-center">
          <span className="text-5xl font-bold text-gray-900 mb-1">{rating.toFixed(1)}</span>
          <div className="mb-1">
            <StarRating rating={rating} size={16} />
          </div>
          <span className="text-xs text-gray-500">{reviewCount} отзыв{reviewCount === 1 ? '' : reviewCount && reviewCount < 5 ? 'а' : 'ов'}</span>
        </div>

        {/* Rating bars - thinner and cleaner */}
        {reviews.length > 0 && (
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((stars, idx) => {
              const count = distribution[idx];
              const percentage = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
              
              return (
                <div key={stars} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-6">{stars}★</span>
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Individual reviews */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.slice(0, 5).map((review, idx) => {
            const reviewText = review.textTranslated || review.text || '';
            const reviewDate = review.publishedAtDate || review.created_at;
            
            return (
              <div key={idx} className="border-t border-gray-200 pt-4 first:border-t-0 first:pt-0">
                {/* Reviewer info */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{review.name || 'Аноним'}</span>
                    <StarRating rating={review.stars || 0} size={14} />
                  </div>
                  
                  {/* Date */}
                  {reviewDate && (
                    <span className="text-xs text-gray-500">{formatDate(reviewDate)}</span>
                  )}
                </div>
                
                {/* Review text */}
                {reviewText && (
                  <p className="text-gray-700 text-sm leading-relaxed">{reviewText}</p>
                )}
              </div>
            );
          })}
          
          {/* Show "more reviews" hint if there are more */}
          {reviews.length > 5 && (
            <div className="text-center pt-4">
              <p className="text-gray-500 text-sm">
                И ещё {reviews.length - 5} отзывов...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
