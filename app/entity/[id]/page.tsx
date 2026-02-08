'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import EntityHeader from '@/components/EntityHeader';
import EntityActions from '@/components/EntityActions';
import EntityFeatures from '@/components/EntityFeatures';
import EntityLocation from '@/components/EntityLocation';
import EntityReviews from '@/components/EntityReviews';

export default function EntityDetailPage() {
  const params = useParams();
  const entityId = params.id as string;

  const [entity, setEntity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadEntity();
    loadFavoriteStatus();
  }, [entityId]);

  const loadEntity = async () => {
    try {
      // Load from API first
      const response = await fetch(`/api/entities/${entityId}`);
      
      if (response.ok) {
        const data = await response.json();
        setEntity(data);
        setLoading(false);
        return;
      }

      // Fallback to localStorage
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
          <button 
            onClick={() => window.history.back()} 
            className="text-primary hover:underline"
          >
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header: Gallery + Title + Rating */}
      <EntityHeader
        entity={entity}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
      />

      {/* Content sections with consistent gray background */}
      <div className="bg-gray-50">
        {/* Status + Buttons (including copy address) - gray background */}
        <EntityActions 
          entity={entity}
          onShowToast={showToastMessage}
        />

        {/* Average check + Features - white backgrounds inside */}
        <EntityFeatures entity={entity} />

        {/* Location - white background inside */}
        <EntityLocation 
          entity={entity} 
          onShowToast={showToastMessage}
        />

        {/* Reviews - white background inside */}
        <EntityReviews entity={entity} />
      </div>

      {/* Toast notification */}
      {showToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-gray-900 text-white rounded-full shadow-lg animate-fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
