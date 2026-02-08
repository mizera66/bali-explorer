'use client';

import { useState } from 'react';

interface EntityFeaturesProps {
  entity: {
    average_check?: string;
    additionalInfo?: any;
  };
}

export default function EntityFeatures({ entity }: EntityFeaturesProps) {
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  
  // Extract features from additionalInfo
  const getFeatures = () => {
    if (!entity.additionalInfo) return [];
    
    const features: string[] = [];
    
    try {
      // additionalInfo structure: { "Услуги": [{"Терраса": true}, ...], "Визитная карточка": [...] }
      Object.values(entity.additionalInfo).forEach((section: any) => {
        if (Array.isArray(section)) {
          section.forEach((item: any) => {
            // Each item is an object like {"Терраса": true}
            if (typeof item === 'object' && item !== null) {
              Object.entries(item).forEach(([key, value]) => {
                // Only add if value is true
                if (value === true) {
                  features.push(key);
                }
              });
            }
          });
        }
      });
    } catch (e) {
      console.error('Failed to parse features:', e);
    }
    
    // Remove duplicates
    const uniqueFeatures = Array.from(new Set(features));
    return uniqueFeatures;
  };

  const features = getFeatures();
  const hasAverageCheck = entity.average_check && entity.average_check.trim();
  const hasFeatures = features.length > 0;

  // Don't render if nothing to show
  if (!hasAverageCheck && !hasFeatures) return null;

  return (
    <div className="bg-gray-50 px-5 py-2 mb-2">
      {/* Average check - compact green block with border */}
      {hasAverageCheck && (
        <div className="bg-green-50 rounded-xl p-3 mb-3 border border-green-600">
          <div className="text-gray-600 text-xs font-medium mb-1 uppercase tracking-wide">💰 Средний чек</div>
          <div className="flex items-baseline gap-2">
            <span className="text-green-600 font-bold text-xl">
              {entity.average_check}
            </span>
            <span className="text-sm text-gray-600">на человека</span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">по отзывам посетителей</div>
        </div>
      )}

      {/* Features from additionalInfo only */}
      {hasFeatures && (
        <div>
          <div className="text-gray-900 font-semibold text-sm mb-3">Особенности</div>
          <div className="flex flex-wrap gap-2">
            {features.slice(0, showAllFeatures ? features.length : 8).map((feature, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                <span>{getFeatureEmoji(feature)}</span>
                <span>{feature}</span>
              </span>
            ))}
            
            {/* Show "+X" button if more than 8 features - clickable to expand */}
            {features.length > 8 && !showAllFeatures && (
              <button
                onClick={() => setShowAllFeatures(true)}
                className="inline-flex items-center px-3 py-2 bg-gray-200 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-300 transition-colors active:scale-95"
              >
                +{features.length - 8}
              </button>
            )}

            {/* Show "Свернуть" button when expanded */}
            {showAllFeatures && (
              <button
                onClick={() => setShowAllFeatures(false)}
                className="inline-flex items-center px-3 py-2 bg-gray-200 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-300 transition-colors active:scale-95"
              >
                Свернуть
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper: Get emoji for feature
function getFeatureEmoji(feature: string): string {
  const lower = feature.toLowerCase();
  
  // Map common features to emojis
  if (lower.includes('wifi') || lower.includes('вай-фай') || lower.includes('wi-fi')) return '📶';
  if (lower.includes('терраса') || lower.includes('терасса')) return '🏡';
  if (lower.includes('парковка') || lower.includes('parking')) return '🅿️';
  if (lower.includes('кондиционер') || lower.includes('ac')) return '❄️';
  if (lower.includes('бар') || lower.includes('bar')) return '🍸';
  if (lower.includes('вид') || lower.includes('view')) return '🌅';
  if (lower.includes('пляж') || lower.includes('beach')) return '🏖️';
  if (lower.includes('бассейн') || lower.includes('pool')) return '🏊';
  if (lower.includes('музыка') || lower.includes('music')) return '🎵';
  if (lower.includes('веган') || lower.includes('vegan')) return '🌱';
  if (lower.includes('детск') || lower.includes('kid')) return '👶';
  if (lower.includes('карт') || lower.includes('card')) return '💳';
  if (lower.includes('достав') || lower.includes('delivery')) return '🚚';
  if (lower.includes('завтрак') || lower.includes('breakfast')) return '🍳';
  if (lower.includes('кофе') || lower.includes('coffee')) return '☕';
  if (lower.includes('коктейл') || lower.includes('cocktail')) return '🍹';
  if (lower.includes('улица') || lower.includes('street') || lower.includes('outdoor')) return '🌳';
  
  // Default emoji
  return '✨';
}
