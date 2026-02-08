'use client';

import { Star } from 'lucide-react';
import { Entity } from '@/data/db';
import Link from 'next/link';
import LazyImage from './LazyImage';
import { getOpenStatus, getOpenStatusColor } from '@/lib/workHours';
import StarRating from './StarRating';

interface EntityCardProps {
  entity: Entity;
}

export default function EntityCard({ entity }: EntityCardProps) {
  const openStatus = getOpenStatus(entity);
  const statusColor = getOpenStatusColor(entity);

  return (
    <Link
      href={`/entity/${entity.id}`}
      className="block bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all overflow-hidden"
    >
      {/* Image */}
      {entity.image_url && (
        <div className="relative h-48">
          <LazyImage
            src={entity.image_url}
            alt={entity.title}
            className="rounded-t-2xl"
            aspectRatio="2/1"
          />
          {/* Open/Closed status */}
          {openStatus && (
            <div className="absolute bottom-2 left-2">
              <span className={`text-xs font-medium px-2 py-1 rounded bg-white/90 backdrop-blur-sm ${statusColor}`}>
                {openStatus}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-bold text-sm md:text-lg text-gray-900 mb-2 line-clamp-2">
          {entity.title}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <StarRating rating={Number(entity.rating || 0)} size={16} showEmpty={false} />
          <span className="text-sm font-medium text-gray-700">
            {Number(entity.rating || 0).toFixed(1)}
          </span>
          <span className="text-sm text-gray-500">
            ({entity.rating_count})
          </span>
        </div>

        {/* Area & Price */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{entity.area}</span>
          <span className="text-primary font-bold">
            {'$'.repeat(entity.price_level)}
          </span>
        </div>
      </div>
    </Link>
  );
}
