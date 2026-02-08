'use client';

import { useState } from 'react';
import { Phone, Calendar, UtensilsCrossed, MapPin, Copy, Check, Globe } from 'lucide-react';

interface EntityActionsProps {
  entity: {
    phone?: string;
    menu?: any;
    reserveTableUrl?: string;
    tableReservationLinks?: any[];
    openingHours?: any;
    popularTimesLiveText?: string;
    popularTimesHistogram?: any;
    url?: string; // Google Maps URL
    location?: { lat: string; lng: string };
    address?: string; // Address for copy button
    website?: string; // Website URL
  };
  onShowToast?: (message: string) => void;
}

export default function EntityActions({ entity, onShowToast }: EntityActionsProps) {
  const [copied, setCopied] = useState(false);

  // Copy address handler
  const copyAddress = () => {
    if (entity.address) {
      navigator.clipboard.writeText(entity.address);
      setCopied(true);
      if (onShowToast) onShowToast('Адрес скопирован');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get open/closed status
  const getOpenStatus = () => {
    if (!entity.openingHours) return null;
    
    // Get Bali time (UTC+8)
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const baliTime = new Date(utcTime + (8 * 3600000));
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[baliTime.getDay()];
    const todayHours = (entity.openingHours as any)[currentDay];
    
    if (!todayHours || todayHours.closed) {
      return { text: 'Закрыто', isOpen: false, time: null };
    }
    
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
    if (!entity.popularTimesHistogram || !entity.popularTimesLiveText) return null;
    
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
    } catch (e) {
      console.error('Failed to parse busyness:', e);
    }
    
    return null;
  };

  const openStatus = getOpenStatus();
  const busyness = getBusynessInfo();

  // Get booking URL
  const getBookingUrl = () => {
    if (entity.reserveTableUrl) return entity.reserveTableUrl;
    
    if (entity.tableReservationLinks && entity.tableReservationLinks.length > 0) {
      const firstLink = entity.tableReservationLinks[0];
      return firstLink?.link || null;
    }
    
    return null;
  };

  const bookingUrl = getBookingUrl();

  // Get menu URL
  const getMenuUrl = () => {
    if (!entity.menu) return null;
    
    // Check different possible formats
    if (typeof entity.menu === 'string') return entity.menu;
    if (entity.menu.link) return entity.menu.link;
    if (entity.menu.url) return entity.menu.url;
    
    return null;
  };

  const menuUrl = getMenuUrl();

  // Get Google Maps URL
  const getGoogleMapsUrl = () => {
    if (entity.url) return entity.url;
    if (entity.location && entity.location.lat && entity.location.lng) {
      return `https://www.google.com/maps/search/?api=1&query=${entity.location.lat},${entity.location.lng}`;
    }
    return null;
  };

  const mapsUrl = getGoogleMapsUrl();

  // Count how many buttons we have
  const hasRoute = !!mapsUrl;
  const hasPhone = !!entity.phone;
  const hasMenu = !!menuUrl;
  const hasBooking = !!bookingUrl;
  const hasWebsite = !!(entity.website && entity.website.trim());
  const hasAddress = !!(entity.address && entity.address.trim());
  const buttons = [hasRoute, hasPhone, hasMenu, hasBooking, hasWebsite, hasAddress].filter(Boolean);
  const totalButtons = buttons.length;

  // Don't render if no buttons and no busyness
  if (totalButtons === 0 && !busyness) return null;

  return (
    <div className="px-5 py-2">
      {/* Busyness badge only (status moved to header) */}
      {busyness && (
        <div className="mb-4">
          <div className="inline-flex items-center px-3 py-1.5 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
            Обычно загружено
          </div>
        </div>
      )}

      {/* Action buttons - horizontal scroll on mobile with partial 5th button visible */}
      {totalButtons > 0 && (
        <div className="relative -mx-5 px-5 bg-gray-50 py-3">
          <div 
            className={`flex gap-2 overflow-x-auto pb-2 scrollbar-hide ${
              totalButtons > 4 ? 'pr-12' : ''
            }`} 
            style={{ 
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {/* Google Maps button */}
            {hasRoute && (
              <a
                href={mapsUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center py-3 px-3 bg-white text-gray-900 rounded-xl hover:bg-gray-50 transition-all active:scale-95 flex-shrink-0 min-w-[80px] shadow"
                style={{ scrollSnapAlign: 'start' }}
              >
                <MapPin size={20} className="mb-1" />
                <span className="text-xs font-medium whitespace-nowrap">Google Maps</span>
              </a>
            )}

            {/* Phone button - GREEN (exact shade from reference) */}
            {hasPhone && (
              <a
                href={`tel:${entity.phone}`}
                className="flex flex-col items-center justify-center py-3 px-3 rounded-xl transition-all bg-[#16a34a] text-white hover:bg-green-700 active:scale-95 flex-shrink-0 min-w-[80px] shadow"
                style={{ scrollSnapAlign: 'start' }}
              >
                <Phone size={20} className="mb-1" />
                <span className="text-xs font-semibold">Позвонить</span>
              </a>
            )}

            {/* Menu button */}
            {hasMenu && (
              <a
                href={menuUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center py-3 px-3 bg-white text-gray-900 rounded-xl hover:bg-gray-50 transition-all active:scale-95 flex-shrink-0 min-w-[80px] shadow"
                style={{ scrollSnapAlign: 'start' }}
              >
                <UtensilsCrossed size={20} className="mb-1" />
                <span className="text-xs font-medium">Меню</span>
              </a>
            )}

            {/* Booking button */}
            {hasBooking && (
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center py-3 px-3 bg-white text-gray-900 rounded-xl hover:bg-gray-50 transition-all active:scale-95 flex-shrink-0 min-w-[80px] shadow"
                style={{ scrollSnapAlign: 'start' }}
              >
                <Calendar size={20} className="mb-1" />
                <span className="text-xs font-medium">Бронь</span>
              </a>
            )}

            {/* Website button */}
            {hasWebsite && (
              <a
                href={entity.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center py-3 px-3 bg-white text-gray-900 rounded-xl hover:bg-gray-50 transition-all active:scale-95 flex-shrink-0 min-w-[80px] shadow"
                style={{ scrollSnapAlign: 'start' }}
              >
                <Globe size={20} className="mb-1" />
                <span className="text-xs font-medium">Сайт</span>
              </a>
            )}

            {/* Copy address button */}
            {hasAddress && (
              <button
                onClick={copyAddress}
                className="flex flex-col items-center justify-center py-3 px-3 bg-white text-gray-900 rounded-xl hover:bg-gray-50 transition-all active:scale-95 flex-shrink-0 min-w-[80px] shadow"
                style={{ scrollSnapAlign: 'start' }}
              >
                {copied ? (
                  <>
                    <Check size={20} className="mb-1 text-green-600" />
                    <span className="text-xs font-medium">Готово</span>
                  </>
                ) : (
                  <>
                    <Copy size={20} className="mb-1" />
                    <span className="text-xs font-medium">Адрес</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
