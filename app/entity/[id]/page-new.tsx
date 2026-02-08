'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Heart, Phone, MapPin, ExternalLink, Clock } from 'lucide-react';
import Image from 'next/image';

interface EntityData {
  id: string;
  title: string;
  categoryName: string;
  area: string;
  totalScore: number;
  reviewsCount: number;
  phone?: string;
  phoneUnformatted?: string;
  website?: string;
  menu?: any;
  reserveTableUrl?: string;
  tableReservationLinks?: any[];
  imageUrl: string;
  gallery?: string[];
  location?: { lat: string; lng: string };
  openingHours?: any;
  additionalInfo?: Record<string, any>;
  popularTimesLiveText?: string;
  popularTimesLivePercent?: number;
  popularTimesHistogram?: any;
  reviews?: any[];
  average_check?: string;
}

export default function EntityDetailPageNew() {
  const params = useParams();
  const router = useRouter();
  const entityId = params.id as string;

  const [entity, setEntity] = useState<EntityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadEntity();
    loadFavoriteStatus();
  }, [entityId]);

  const loadEntity = async () => {
    try {
      // Load from localStorage
      const localData = localStorage.getItem('bali_entities');
      if (localData) {
        const localEntities = JSON.parse(localData);
        const localEntity = localEntities.find((e: any) => e.id === entityId);
        
        if (localEntity) {
          setEntity(localEntity);
          setLoading(false);
          return;
        }
      }

      // Fallback: load from API
      const response = await fetch(`/api/entities`);
      const data = await response.json();
      const found = data.entities.find((e: any) => e.id === entityId);
      
      if (found) {
        setEntity(found);
      }
    } catch (error) {
      console.error('Error loading entity:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavoriteStatus = () => {
    const favorites = JSON.parse(localStorage.getItem('bali-explorer-favorites') || '[]');
    setIsFavorite(favorites.includes(entityId));
  };

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('bali-explorer-favorites') || '[]');
    const newFavorites = isFavorite
      ? favorites.filter((id: string) => id !== entityId)
      : [...favorites, entityId];
    
    localStorage.setItem('bali-explorer-favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
  };

  // Get all images for gallery
  const allImages = entity ? [
    entity.imageUrl,
    ...(entity.gallery || [])
  ].filter(Boolean) : [];

  // Calculate busy percentage from histogram
  const getBusyPercentage = (): number | null => {
    if (!entity?.popularTimesHistogram) return null;
    
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday
    const currentHour = now.getHours();
    
    const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const dayData = entity.popularTimesHistogram[dayNames[currentDay]];
    
    if (dayData && dayData.data && dayData.data[currentHour]) {
      return dayData.data[currentHour];
    }
    
    return entity.popularTimesLivePercent || null;
  };

  // Extract features from additionalInfo
  const getFeatures = (): string[] => {
    if (!entity?.additionalInfo) return [];
    
    const features: string[] = [];
    
    Object.entries(entity.additionalInfo).forEach(([category, items]) => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          if (typeof item === 'string') {
            features.push(item);
          } else if (item && typeof item === 'object' && 'Наименование' in item) {
            features.push(item['Наименование']);
          }
        });
      }
    });
    
    return features.filter(Boolean).slice(0, 8); // Max 8 features
  };

  // Get opening status
  const getOpeningStatus = () => {
    if (!entity?.openingHours) return null;
    
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[now.getDay()];
    const currentHours = entity.openingHours[currentDay];
    
    if (!currentHours || currentHours.closed) {
      return { text: 'Закрыто', isOpen: false };
    }
    
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMin] = currentHours.open.split(':').map(Number);
    const [closeHour, closeMin] = currentHours.close.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;
    
    const isOpen = currentTime >= openTime && currentTime < closeTime;
    
    return {
      text: isOpen ? `Открыто до ${currentHours.close}` : 'Закрыто',
      isOpen
    };
  };

  // Get reservation URL
  const getReservationUrl = (): string | null => {
    if (entity?.reserveTableUrl) return entity.reserveTableUrl;
    if (entity?.tableReservationLinks && entity.tableReservationLinks.length > 0) {
      const firstLink = entity.tableReservationLinks[0];
      return firstLink.url || firstLink.link || null;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Карточка не найдена</div>
      </div>
    );
  }

  const openingStatus = getOpeningStatus();
  const busyPercent = getBusyPercentage();
  const features = getFeatures();
  const reservationUrl = getReservationUrl();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Image Gallery */}
      <div className="relative">
        {/* Image */}
        <div className="relative h-[400px] bg-gray-200">
          <Image
            src={allImages[currentImageIndex] || '/placeholder.jpg'}
            alt={entity.title}
            fill
            className="object-cover"
            priority
          />
          
          {/* Image counter */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
              {currentImageIndex + 1}/{allImages.length}
            </div>
          )}
          
          {/* Navigation buttons */}
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 bg-white rounded-full p-2 shadow-lg"
          >
            <ArrowLeft size={24} className="text-gray-800" />
          </button>
          
          <button
            onClick={toggleFavorite}
            className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg"
          >
            <Heart
              size={24}
              className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-800'}
            />
          </button>
        </div>

        {/* Content Card */}
        <div className="relative -mt-6 bg-white rounded-t-3xl px-6 pt-6">
          {/* Title and Category */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-900 flex-1">
              {entity.title}
            </h1>
            {entity.categoryName && (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap">
                {entity.categoryName.split(',')[0]}
              </span>
            )}
          </div>

          {/* Location */}
          <div className="text-gray-600 mb-4">{entity.area}</div>

          {/* Rating */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold">💵 {entity.totalScore || '0.0'}</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={star <= Math.floor(entity.totalScore || 0) ? 'text-yellow-400' : 'text-gray-300'}
                  >
                    ⭐
                  </span>
                ))}
              </div>
            </div>
            <span className="text-green-600 font-medium">✓</span>
            <span className="text-gray-600">{entity.reviewsCount || 0} отзыва</span>
          </div>

          {/* Opening Status and Busy */}
          <div className="flex items-center gap-3 mb-6">
            {openingStatus && (
              <div
                className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 ${
                  openingStatus.isOpen
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Clock size={16} />
                {openingStatus.text}
              </div>
            )}
            
            {busyPercent !== null && (
              <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm">
                Обычно загружено на {busyPercent}%
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {/* Phone */}
            {entity.phone && (
              <a
                href={`tel:${entity.phoneUnformatted || entity.phone}`}
                className="flex flex-col items-center gap-2 bg-green-500 text-white rounded-xl py-3 px-4 hover:bg-green-600 transition-colors"
              >
                <Phone size={24} />
                <span className="text-sm font-medium">Позвонить</span>
              </a>
            )}
            
            {/* Menu */}
            {entity.menu && (
              <a
                href={typeof entity.menu === 'string' ? entity.menu : entity.menu.url || entity.menu.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 rounded-xl py-3 px-4 hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl">🍴</span>
                <span className="text-sm font-medium">Меню</span>
              </a>
            )}
            
            {/* Reservation */}
            {reservationUrl && (
              <a
                href={reservationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 rounded-xl py-3 px-4 hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl">📅</span>
                <span className="text-sm font-medium">Бронь</span>
              </a>
            )}
          </div>

          {/* Average Check */}
          {entity.average_check && (
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                💰 Средний чек
              </h3>
              <div className="text-green-600 text-xl font-bold">
                {entity.average_check} <span className="text-sm text-gray-600">на человека</span>
              </div>
            </div>
          )}

          {/* Features */}
          {features.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {features.slice(0, 7).map((feature, index) => (
                  <div
                    key={index}
                    className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2"
                  >
                    {getFeatureIcon(feature)}
                    <span>{feature}</span>
                  </div>
                ))}
                {features.length > 7 && (
                  <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium">
                    +{features.length - 7}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location Section */}
          {entity.location && (
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <MapPin size={20} className="text-green-600" />
                Локация
              </h3>
              
              {/* Map placeholder */}
              <div className="relative h-48 bg-gray-200 rounded-xl overflow-hidden mb-3">
                <iframe
                  src={`https://www.google.com/maps?q=${entity.location.lat},${entity.location.lng}&z=15&output=embed`}
                  className="w-full h-full"
                  loading="lazy"
                />
              </div>
              
              {/* Map buttons */}
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg py-3 px-4 hover:bg-gray-50 transition-colors">
                  <span>📋</span>
                  <span className="font-medium">Скопировать</span>
                </button>
                <a
                  href={`https://www.google.com/maps?q=${entity.location.lat},${entity.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg py-3 px-4 hover:bg-gray-50 transition-colors"
                >
                  <MapPin size={18} />
                  <span className="font-medium">Открыть в Google Maps</span>
                </a>
              </div>
            </div>
          )}

          {/* Rating and Reviews Section */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3">Рейтинг и отзывы</h3>
            
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={star <= Math.floor(entity.totalScore || 0) ? 'text-yellow-400 text-xl' : 'text-gray-300 text-xl'}
                  >
                    ⭐
                  </span>
                ))}
              </div>
              <span className="text-xl font-bold">{entity.totalScore || '0.0'}</span>
              <span className="text-gray-600">({entity.reviewsCount || 0} отзыва)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function for feature icons
function getFeatureIcon(feature: string): string {
  const iconMap: Record<string, string> = {
    'Терраса': '🌿',
    'WiFi': '📶',
    'Корреге': '🍽️',
    'Улик': '🛣️',
    'Парковка': '🅿️',
    'Кондиционер': '❄️',
    'Вегетарианские блюда': '🥗',
    'Алкоголь': '🍷',
  };
  
  for (const [key, icon] of Object.entries(iconMap)) {
    if (feature.toLowerCase().includes(key.toLowerCase())) {
      return icon;
    }
  }
  
  return '✨';
}
