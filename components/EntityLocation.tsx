'use client';

import { useState } from 'react';
import { MapPin, Copy, Check } from 'lucide-react';

interface EntityLocationProps {
  entity: {
    address?: string;
    location?: { lat: string; lng: string };
    url?: string; // Google Maps URL
  };
  onShowToast?: (message: string) => void;
}

export default function EntityLocation({ entity, onShowToast }: EntityLocationProps) {
  const [copied, setCopied] = useState(false);

  const hasAddress = entity.address && entity.address.trim();
  const hasLocation = entity.location && entity.location.lat && entity.location.lng;

  // Don't render if no location data
  if (!hasAddress && !hasLocation) return null;

  const copyAddress = () => {
    if (entity.address) {
      navigator.clipboard.writeText(entity.address);
      setCopied(true);
      if (onShowToast) onShowToast('Адрес скопирован');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Build Google Maps URLs
  const getGoogleMapsUrl = () => {
    // Prioritize entity.url if available
    if (entity.url) return entity.url;
    
    // Fallback to coordinates
    if (!hasLocation) return null;
    return `https://www.google.com/maps/search/?api=1&query=${entity.location!.lat},${entity.location!.lng}`;
  };

  const getStaticMapUrl = () => {
    if (!hasLocation) return null;
    // Using Google Maps Static API (can also use other services)
    const lat = entity.location!.lat;
    const lng = entity.location!.lng;
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&markers=color:red%7C${lat},${lng}&key=YOUR_API_KEY`;
  };

  const googleMapsUrl = getGoogleMapsUrl();

  return (
    <div className="bg-gray-50 px-5 py-4 mb-2">
      {/* Section title */}
      <h2 className="flex items-center gap-2 text-gray-900 font-semibold text-sm mb-3">
        <MapPin size={18} className="text-gray-600" />
        Локация
      </h2>
      
      {/* Compact Map with actual Google Maps iframe */}
      {hasLocation && (
        <div className="bg-gray-200 rounded-2xl h-40 mb-3 overflow-hidden relative">
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0 }}
            src={`https://maps.google.com/maps?q=${entity.location!.lat},${entity.location!.lng}&z=15&output=embed`}
            allowFullScreen
            loading="lazy"
          />
        </div>
      )}

      {/* Address below map */}
      {hasAddress && (
        <div className="text-gray-600 text-sm mb-2 flex items-start gap-2">
          <span className="text-gray-400 mt-0.5">📍</span>
          <span>{entity.address}</span>
        </div>
      )}

      {/* Address text if no map */}
      {!hasLocation && hasAddress && (
        <div className="p-3 bg-gray-50 rounded-xl">
          <p className="text-gray-700 text-sm">{entity.address}</p>
        </div>
      )}
    </div>
  );
}
