'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star, Heart, Phone, MapPin, ExternalLink, Calendar, UtensilsCrossed, Copy, Check } from 'lucide-react';
import Image from 'next/image';

interface EntityData {
  id: string;
  title: string;
  categoryName: string;
  totalScore: number;
  reviewsCount: number;
  phone?: string;
  website?: string;
  address?: string;
  location?: { lat: string; lng: string };
  imageUrl?: string;
  gallery?: string[];
  average_check?: string;
  menu?: any;
  reserveTableUrl?: string;
  tableReservationLinks?: any[];
  additionalInfo?: any;
  popularTimesLiveText?: string;
  popularTimesHistogram?: any;
  openingHours?: any[];
  reviews?: any[];
  placeId?: string;
}

export default function EntityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const entityId = params.id as string;

  const [entity, setEntity] = useState<EntityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [copied, setCopied] = useState(false);

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

      // Fallback to API
      const response = await fetch(`/api/entities`);
      const data = await response.json();
      const found = data.entities.find((e: any) => e.id === entityId);
      
      if (found) {
        setEntity(found);
      }
    } catch (error) {
      console.error('Failed to load entity:', error);
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
    
    if (isFavorite) {
      const updated = favorites.filter((id: string) => id !== entityId);
      localStorage.setItem('bali-explorer-favorites', JSON.stringify(updated));
      setIsFavorite(false);
      showToastMessage('Удалено из избранного');
    } else {
      favorites.push(entityId);
      localStorage.setItem('bali-explorer-favorites', JSON.stringify(favorites));
      setIsFavorite(true);
      showToastMessage('Добавлено в избранное');
    }
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const copyAddress = () => {
    if (entity?.address) {
      navigator.clipboard.writeText(entity.address);
      setCopied(true);
      showToastMessage('Адрес скопирован');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get open/closed status
  const getOpenStatus = () => {
    if (!entity?.openingHours) return null;
    
    // Get Bali time (UTC+8)
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const baliTime = new Date(utcTime + (8 * 3600000));
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[baliTime.getDay()];
    const todayHours = (entity.openingHours as any)[currentDay];
    
    if (!todayHours || todayHours.closed) return { text: 'Закрыто', isOpen: false, time: null };
    
    const currentMinutes = baliTime.getHours() * 60 + baliTime.getMinutes();
    const [openHour, openMin] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;
    
    const isOpen = currentMinutes >= openTime && currentMinutes < closeTime;
    
    return {
      text: isOpen ? 'Открыто' : 'Закрыто',
      isOpen,
      time: isOpen ? `до ${todayHours.close}` : null
    };
  };

  // Get busyness percentage from histogram
  const getBusynessInfo = () => {
    if (!entity?.popularTimesHistogram || !entity.popularTimesLiveText) return null;
    
    try {
      const now = new Date();
      const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
      const baliTime = new Date(utcTime + (8 * 3600000));
      
      const dayIndex = (baliTime.getDay() + 6) % 7; // Monday = 0
      const currentHour = baliTime.getHours();
      
      if (entity.popularTimesHistogram[dayIndex]?.data[currentHour]) {
        const occupancy = entity.popularTimesHistogram[dayIndex].data[currentHour].occupancy || 0;
        return {
          percentage: occupancy,
          text: entity.popularTimesLiveText
        };
      }
    } catch (e) {}
    
    return null;
  };

  // Get features from additionalInfo
  const getFeatures = () => {
    if (!entity?.additionalInfo) return [];
    
    const features: string[] = [];
    
    Object.values(entity.additionalInfo).forEach((section: any) => {
      if (Array.isArray(section)) {
        section.forEach((item: any) => {
          if (item.name) features.push(item.name);
        });
      }
    });
    
    return features.slice(0, 9); // Max 9 features
  };

  // Build gallery
  const allImages = entity ? [
    entity.imageUrl,
    ...(entity.gallery || [])
  ].filter(Boolean) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Карточка не найдена</p>
          <button onClick={() => router.back()} className="text-primary hover:underline">
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  const openStatus = getOpenStatus();
  const busyness = getBusynessInfo();
  const features = getFeatures();
  
  // Get booking URL
  const bookingUrl = entity.reserveTableUrl || 
                     (entity.tableReservationLinks && entity.tableReservationLinks.length > 0 
                      ? entity.tableReservationLinks[0]?.link 
                      : null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with gallery */}
      <div className="relative">
        {/* Image gallery */}
        <div className="relative h-80 bg-gray-200">
          {allImages.length > 0 && (
            <>
              <Image
                src={allImages[currentImageIndex] || '/placeholder.jpg'}
                alt={entity.title}
                fill
                className="object-cover"
                priority
              />
              
              {/* Image counter */}
              <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 text-white rounded-full text-sm backdrop-blur-sm">
                {currentImageIndex + 1}/{allImages.length}
              </div>
            </>
          )}
        </div>

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors z-10"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Favorite button */}
        <button
          onClick={toggleFavorite}
          className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors z-10"
        >
          <Heart
            size={20}
            className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-700'}
          />
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-t-3xl -mt-6 relative z-10 px-4 pt-6 pb-20">
        {/* Title and category */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{entity.title}</h1>
            {entity.categoryName && (
              <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                {entity.categoryName}
              </span>
            )}
          </div>
        </div>

        {/* Location */}
        {entity.address && (
          <div className="text-gray-600 text-sm mb-4">
            {entity.address}
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1">
            <span className="text-xl font-bold text-gray-900">💰 {entity.totalScore || 0}</span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < Math.floor(entity.totalScore || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Check size={16} className="text-green-600" />
            <span>{entity.reviewsCount || 0} отзыва</span>
          </div>
        </div>

        {/* Open/Closed status + Busyness */}
        <div className="flex items-center gap-3 mb-6">
          {openStatus && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${
              openStatus.isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${openStatus.isOpen ? 'bg-green-600' : 'bg-gray-600'}`} />
              <span className="font-medium text-sm">
                {openStatus.text}
                {openStatus.time && ` ${openStatus.time}`}
              </span>
            </div>
          )}

          {busyness && (
            <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-xl text-sm">
              В это время обычно загружено на {busyness.percentage}%
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {/* Phone */}
          {entity.phone && (
            <a
              href={`tel:${entity.phone}`}
              className="flex flex-col items-center justify-center p-4 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-colors"
            >
              <Phone size={24} className="mb-2" />
              <span className="text-xs font-medium">Позвонить</span>
            </a>
          )}

          {/* Menu */}
          {entity.menu && (
            <a
              href={entity.menu.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-4 bg-gray-100 text-gray-900 rounded-2xl hover:bg-gray-200 transition-colors"
            >
              <UtensilsCrossed size={24} className="mb-2" />
              <span className="text-xs font-medium">Меню</span>
            </a>
          )}

          {/* Booking */}
          {bookingUrl && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-4 bg-gray-100 text-gray-900 rounded-2xl hover:bg-gray-200 transition-colors"
            >
              <Calendar size={24} className="mb-2" />
              <span className="text-xs font-medium">Бронь</span>
            </a>
          )}
        </div>

        {/* Average check */}
        {entity.average_check && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">💰 Средний чек</span>
              <span className="text-green-600 font-bold text-lg">{entity.average_check} на человека</span>
            </div>
          </div>
        )}

        {/* Features */}
        {features.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {features.map((feature, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-800 rounded-xl text-sm"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Location section */}
        {(entity.address || entity.location) && (
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-4">
              <MapPin size={20} className="text-green-600" />
              Локация
            </h2>
            
            {/* Map placeholder */}
            <div className="bg-gray-200 rounded-2xl h-48 mb-3 flex items-center justify-center">
              <span className="text-gray-500">Карта</span>
            </div>

            <div className="flex gap-2">
              {entity.address && (
                <button
                  onClick={copyAddress}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  <span className="text-sm font-medium">Скопировать</span>
                </button>
              )}
              
              {entity.location && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${entity.location.lat},${entity.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <MapPin size={18} />
                  <span className="text-sm font-medium">Открыть в Google Maps</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Reviews section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            💬 Рейтинг и отзывы
          </h2>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-4xl font-bold">{entity.totalScore || 0}</span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={i < Math.floor(entity.totalScore || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                  />
                ))}
              </div>
            </div>
            <span className="text-gray-600">{entity.reviewsCount || 0} отзыва</span>
          </div>

          {/* Review bars (simplified) */}
          {entity.reviews && entity.reviews.length > 0 && (
            <div className="space-y-2 mb-4">
              {[5, 4, 3, 2, 1].map(stars => {
                const count = entity.reviews?.filter(r => r.stars === stars).length || 0;
                const percentage = entity.reviewsCount ? (count / entity.reviewsCount) * 100 : 0;
                
                return (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-6">⭐ {stars}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Individual reviews */}
          {entity.reviews && entity.reviews.length > 0 && (
            <div className="space-y-4">
              {entity.reviews.slice(0, 3).map((review: any, idx: number) => (
                <div key={idx} className="border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">{review.name || 'Аноним'}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < review.stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                  </div>
                  {review.text && (
                    <p className="text-gray-700 text-sm">{review.text}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-gray-900 text-white rounded-full shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
