'use client';

import { useState } from 'react';
import { ArrowLeft, Heart, Info, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import StarRating from './StarRating';

interface EntityHeaderProps {
  entity: {
    id: string;
    title: string;
    categoryName?: string;
    address?: string;
    totalScore?: number;
    reviewsCount?: number;
    imageUrl?: string;
    gallery?: string[];
    openingHours?: any; // For open/closed status
  };
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export default function EntityHeader({ entity, isFavorite, onToggleFavorite }: EntityHeaderProps) {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showSchedule, setShowSchedule] = useState(false); // Modal for work schedule

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
      // Find next open day
      for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (baliTime.getDay() + i) % 7;
        const nextDay = dayNames[nextDayIndex];
        const nextDayHours = (entity.openingHours as any)[nextDay];
        if (nextDayHours && !nextDayHours.closed) {
          return { text: `Закрыто до ${nextDayHours.open}`, isOpen: false };
        }
      }
      return { text: 'Закрыто', isOpen: false };
    }
    
    const currentMinutes = baliTime.getHours() * 60 + baliTime.getMinutes();
    const [openHour, openMin] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;
    
    if (currentMinutes >= openTime && currentMinutes < closeTime) {
      return { text: `Открыто до ${todayHours.close}`, isOpen: true };
    } else {
      return { text: `Закрыто до ${todayHours.open}`, isOpen: false };
    }
  };

  const openStatus = getOpenStatus();

  // Build gallery: only from gallery array (excluding imageUrl)
  const allImages = (entity.gallery || []).filter(Boolean) as string[];

  // Navigate between images
  const handleImageClick = (e: React.MouseEvent) => {
    if (allImages.length <= 1) return;
    
    const clickX = e.clientX;
    const screenWidth = window.innerWidth;
    
    if (clickX > screenWidth / 2) {
      // Click on right side - next image
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    } else {
      // Click on left side - previous image
      setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    }
  };

  return (
    <div className="relative">
      {/* Gallery */}
      <div 
        className="relative h-80 bg-gray-200 cursor-pointer"
        onClick={handleImageClick}
      >
        {allImages.length > 0 && (
          <>
            <Image
              src={allImages[currentImageIndex]}
              alt={entity.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            
            {/* Image counter - positioned higher */}
            {allImages.length > 1 && (
              <div className="absolute bottom-8 right-4 px-3 py-1.5 bg-black/70 text-white rounded-full text-sm font-medium backdrop-blur-sm">
                {currentImageIndex + 1}/{allImages.length}
              </div>
            )}
          </>
        )}
      </div>

      {/* Back button - white icon on black semi-transparent background */}
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-black/60 transition-colors z-10"
      >
        <ArrowLeft size={20} className="text-white" />
      </button>

      {/* Favorite button - white icon on black semi-transparent background */}
      <button
        onClick={onToggleFavorite}
        className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-black/60 transition-colors z-10"
      >
        <Heart
          size={20}
          className={isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}
        />
      </button>

      {/* Content card - gray background, tighter spacing */}
      <div className="bg-gray-50 rounded-t-3xl -mt-6 relative z-10 px-5 pt-6 pb-2">
        {/* Title with stronger emphasis */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">
          {entity.title}
        </h1>

        {/* Status (left) and Category (after status with gap) */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {/* Open/Closed status - entire badge is clickable when has schedule */}
          {openStatus && entity.openingHours && (
            <button
              onClick={() => setShowSchedule(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium text-xs hover:opacity-90 active:scale-95 transition-all ${
                openStatus.isOpen 
                  ? 'bg-[#16a34a] text-white' 
                  : 'bg-red-500 text-white'
              }`}
            >
              <Info size={14} />
              <span className="whitespace-nowrap">
                {openStatus.text}
              </span>
            </button>
          )}

          {/* Status without schedule (not clickable) */}
          {openStatus && !entity.openingHours && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium text-xs ${
              openStatus.isOpen 
                ? 'bg-[#16a34a] text-white' 
                : 'bg-red-500 text-white'
            }`}>
              <span className="whitespace-nowrap">
                {openStatus.text}
              </span>
            </div>
          )}

          {/* Category badge - same height as status with border */}
          {entity.categoryName && (
            <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium border border-gray-600">
              {entity.categoryName}
            </span>
          )}
        </div>

        {/* Work Schedule Modal */}
        {showSchedule && entity.openingHours && (
          <div 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSchedule(false)}
          >
            <div 
              className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">График работы</h3>
                <button
                  onClick={() => setShowSchedule(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Schedule */}
              <div className="space-y-2">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                  const dayData = (entity.openingHours as any)[day];
                  const dayNames: Record<string, string> = {
                    monday: 'Понедельник',
                    tuesday: 'Вторник',
                    wednesday: 'Среда',
                    thursday: 'Четверг',
                    friday: 'Пятница',
                    saturday: 'Суббота',
                    sunday: 'Воскресенье'
                  };
                  
                  // Get current day in Bali time
                  const now = new Date();
                  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
                  const baliTime = new Date(utcTime + (8 * 3600000));
                  const dayNamesEn = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                  const currentDay = dayNamesEn[baliTime.getDay()];
                  const isToday = day === currentDay;

                  return (
                    <div
                      key={day}
                      className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                        isToday ? 'bg-green-50 border border-green-200' : ''
                      }`}
                    >
                      <span className={`text-sm ${isToday ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {dayNames[day]}
                        {isToday && <span className="ml-2 text-xs text-green-600">(сегодня)</span>}
                      </span>
                      <span className="text-sm text-gray-600">
                        {dayData && !dayData.closed ? `${dayData.open} - ${dayData.close}` : 'Выходной'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Rating - compact single line with smaller font */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold text-gray-900">{Number(entity.totalScore || 0).toFixed(1)}</span>
            <StarRating rating={Number(entity.totalScore || 0)} size={18} />
          </div>
          <span className="text-sm text-gray-500">
            {entity.reviewsCount || 0} отзыв{entity.reviewsCount === 1 ? '' : entity.reviewsCount && entity.reviewsCount < 5 ? 'а' : 'ов'}
          </span>
        </div>
      </div>
    </div>
  );
}
