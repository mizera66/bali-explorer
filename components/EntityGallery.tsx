// components/EntityGallery.tsx - Photo gallery with horizontal scroll
// 
// MOBILE: Horizontal scroll like homepage + modal with arrows
// DESKTOP: Grid 2x2 + modal with arrows

'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';

interface EntityGalleryProps {
  images: string[];
  title: string;
}

export default function EntityGallery({ images, title }: EntityGalleryProps) {
  const [showModal, setShowModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const openModal = useCallback((index: number = 0) => {
    setCurrentIndex(index);
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    document.body.style.overflow = '';
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, images.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  // Show at least 3 images for grid
  const gridImages = images.length >= 3 ? images.slice(0, 3) : [
    ...images,
    ...Array(Math.max(0, 3 - images.length)).fill(images[0] || '/placeholder.jpg')
  ];

  return (
    <>
      {/* DESKTOP: 2x2 Grid */}
      <div className="hidden md:block mb-6">
        <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden h-[400px]">
          <div className="row-span-2 relative cursor-pointer hover:opacity-90 transition-opacity" onClick={() => openModal(0)}>
            <Image src={gridImages[0]} alt={`${title} - фото 1`} fill className="object-cover" />
          </div>
          <div className="relative cursor-pointer hover:opacity-90 transition-opacity" onClick={() => openModal(1)}>
            <Image src={gridImages[1]} alt={`${title} - фото 2`} fill className="object-cover" />
          </div>
          <div className="relative cursor-pointer hover:opacity-90 transition-opacity" onClick={() => openModal(2)}>
            <Image src={gridImages[2]} alt={`${title} - фото 3`} fill className="object-cover" />
            {images.length > 3 && (
              <button
                onClick={(e) => { e.stopPropagation(); openModal(0); }}
                className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M3 3h4v4H3V3zm6 0h4v4H9V3zM3 9h4v4H3V9zm6 0h4v4H9V9z"/>
                </svg>
                Показать все {images.length} фото
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE: Horizontal scroll like homepage */}
      <div className="md:hidden relative mb-6">
        {/* Horizontal scroll container */}
        <div 
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative flex-shrink-0 w-full h-[40vh] snap-center cursor-pointer"
              onClick={() => openModal(idx)}
            >
              <Image
                src={img}
                alt={`${title} - фото ${idx + 1}`}
                fill
                className="object-cover rounded-2xl"
                priority={idx === 0}
              />
            </div>
          ))}
        </div>

        {/* Counter badge - 4px above title */}
        <div className="absolute bottom-6 right-6 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-medium backdrop-blur-sm z-10">
          1 / {images.length}
        </div>
      </div>

      {/* MODAL: Fullscreen gallery with arrows */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} className="text-white" />
              </button>
              <div className="text-white font-medium">
                {currentIndex + 1} / {images.length}
              </div>
              <div className="w-10" />
            </div>
          </div>

          {/* Image */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full max-w-7xl max-h-screen p-4 md:p-8">
              <Image
                src={images[currentIndex]}
                alt={`${title} - фото ${currentIndex + 1}`}
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Navigation arrows - ALWAYS visible (mobile + desktop) */}
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white rounded-full shadow-lg hover:scale-110 transition-transform z-20"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {currentIndex < images.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white rounded-full shadow-lg hover:scale-110 transition-transform z-20"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>,
        document.body
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
