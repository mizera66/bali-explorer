// components/EntityForm.tsx - Form matching final data contract
'use client';

import { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';

interface EntityFormProps {
  onClose: () => void;
  onSave?: (data: any) => void;
  initialData?: any;
}

const AVERAGE_CHECKS = [
  '25 000–50 000 Rp',
  '50 000–75 000 Rp',
  '75 000–100 000 Rp',
  '100 000–125 000 Rp',
  '125 000–150 000 Rp',
  '150 000–175 000 Rp',
  '175 000–200 000 Rp',
  '200 000–225 000 Rp',
  '225 000–250 000 Rp',
  '250 000 Rp+',
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Пн',
  tuesday: 'Вт',
  wednesday: 'Ср',
  thursday: 'Чт',
  friday: 'Пт',
  saturday: 'Сб',
  sunday: 'Вс',
};

export default function EntityForm({ onClose, onSave, initialData }: EntityFormProps) {
  const defaultFormData = {
    // Internal fields (not from parser)
    type: 'place',
    status: 'unverified',
    
    // Main fields (from contract)
    title: '',
    price: '',
    categoryName: '', // READ-ONLY from parser
    address: '',
    url: '', // Google Maps link
    location: {
      lat: '',
      lng: '',
    },
    phone: '',
    phoneUnformatted: '', // auto-generated from phone
    website: '',
    
    // Price fields
    price_level: '', // UI field for dropdown
    average_check: '', // Average check dropdown
    
    // Tags
    placesTags: [] as string[],
    
    // Images
    imageUrl: '',
    gallery_1: '',
    gallery_2: '',
    gallery_3: '',
    gallery_4: '',
    gallery_5: '',
    gallery_extra: [] as string[], // For additional images beyond 5
    
    // Opening hours
    openingHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: false },
    },
    
    // Hidden/auto fields
    placeId: '', // hidden, used for deduplication
    totalScore: '', // READ-ONLY from Google
    permanentlyClosed: false,
    temporarilyClosed: false,
    reviewsCount: 0,
    imagesCount: 0,
    additionalInfo: null,
    popularTimesHistogram: null,
    reviews: [],
    menu: null,
    reserveTableUrl: '',
  };

  const [formData, setFormData] = useState(
    initialData 
      ? { ...defaultFormData, ...initialData }
      : defaultFormData
  );

  const updateLocation = (field: string, value: string) => {
    setFormData({
      ...formData,
      location: { ...formData.location, [field]: value },
    });
  };

  const updateOpeningHours = (day: string, field: string, value: any) => {
    setFormData({
      ...formData,
      openingHours: {
        ...formData.openingHours,
        [day]: {
          ...formData.openingHours[day],
          [field]: value,
        },
      },
    });
  };

  const handleSave = async () => {
    // Collect gallery array from individual fields
    const gallery = [
      (formData as any).gallery_1,
      (formData as any).gallery_2,
      (formData as any).gallery_3,
      (formData as any).gallery_4,
      (formData as any).gallery_5,
      ...((formData as any).gallery_extra || [])
    ].filter(url => url && url.trim());
    
    // Auto-generate phoneUnformatted
    const dataToSave = {
      ...formData,
      phoneUnformatted: formData.phone.replace(/[^0-9+]/g, ''),
      gallery, // Add gallery array
      imagesCount: gallery.length,
    };
    
    // Save to API
    try {
      const response = await fetch('/api/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save entity');
      }
      
      const result = await response.json();
      alert('✅ Карточка добавлена в базу данных!');
      
      if (onSave) {
        onSave(dataToSave);
      }
      onClose();
    } catch (error) {
      alert('Ошибка при сохранении: ' + error);
    }
  };

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      let text = await file.text();
      
      // Step 1: Clean control characters
      let cleaned = '';
      for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if (code === 9 || code === 10 || code === 13 || code >= 32) {
          cleaned += text[i];
        }
      }
      
      // Step 2: Try standard parse first
      let jsonData: any;
      try {
        jsonData = JSON.parse(cleaned);
        processImport(jsonData);
        return;
      } catch (standardError) {
        // Standard parse failed, use object-by-object extraction
        console.log('Standard parse failed, using fallback parser...');
      }
      
      // Step 3: Extract objects one by one (fallback for broken JSON)
      const objects: any[] = [];
      let errors = 0;
      let depth = 0;
      let start = -1;
      
      for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];
        
        if (char === '{') {
          if (depth === 0) {
            start = i;
          }
          depth++;
        } else if (char === '}') {
          depth--;
          if (depth === 0 && start >= 0) {
            // Try to parse this object
            const objStr = cleaned.substring(start, i + 1);
            try {
              const obj = JSON.parse(objStr);
              objects.push(obj);
            } catch {
              errors++;
            }
            start = -1;
          }
        }
      }
      
      if (objects.length === 0) {
        throw new Error('Не удалось извлечь ни одного объекта из файла');
      }
      
      // Show warning about errors
      if (errors > 0) {
        console.warn(`Пропущено ${errors} поврежденных объектов`);
      }
      
      processImport(objects);
      
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      alert(`❌ Ошибка при импорте:\n\n${errorMsg}\n\n⚠️ Попробуйте:\n• Пересоздать экспорт из парсера\n• Использовать другой файл`);
    }
    
    event.target.value = '';
  };

  const processImport = async (jsonData: any) => {
    try {
      // Ensure it's an array
      const items = Array.isArray(jsonData) ? jsonData : [jsonData];
      
      // Send to API
      const response = await fetch('/api/upload-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items)
      });
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      const result = await response.json();
      
      // Show report
      let report = `✅ Импорт завершен!\n\n`;
      report += `📊 Статистика:\n`;
      report += `• Добавлено: ${result.succeeded || 0}\n`;
      report += `• Ошибок: ${result.failed || 0}\n`;
      report += `• Всего обработано: ${result.processed || 0}\n`;
      
      if (result.errors && result.errors.length > 0) {
        report += `\n⚠️ Ошибки (${result.errors.length}):\n`;
        report += result.errors.slice(0, 3).join('\n');
        if (result.errors.length > 3) {
          report += `\n... и еще ${result.errors.length - 3}`;
        }
      }
      
      alert(report);
      
      // Close form and trigger parent reload
      if (onSave) {
        onSave({}); // Trigger reload in parent
      }
    } catch (error: any) {
      alert(`❌ Ошибка при импорте:\n\n${error.message || 'Unknown error'}`);
    }
  };

  // Helper: Parse opening hours from JSON format to our format
  const parseOpeningHours = (hours: any[]) => {
    const dayMap: Record<string, string> = {
      'понедельник': 'monday',
      'вторник': 'tuesday',
      'среда': 'wednesday',
      'четверг': 'thursday',
      'пятница': 'friday',
      'суббота': 'saturday',
      'воскресенье': 'sunday',
    };
    
    const result: any = {};
    
    hours.forEach((item: any) => {
      const dayKey = dayMap[item.day.toLowerCase()];
      if (dayKey && item.hours) {
        const timeMatch = item.hours.match(/(\d{2}:\d{2})\s+to\s+(\d{2}:\d{2})/);
        if (timeMatch) {
          result[dayKey] = {
            open: timeMatch[1],
            close: timeMatch[2],
            closed: false,
          };
        }
      }
    });
    
    // Fill missing days with default
    DAYS.forEach(day => {
      if (!result[day]) {
        result[day] = { open: '09:00', close: '18:00', closed: false };
      }
    });
    
    return result;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="min-h-screen bg-gray-50">
        {/* Sticky Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold text-gray-900">Новая карточка</h1>
              </div>
              <div className="flex items-center gap-2">
                {/* Import JSON button */}
                <label className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  Импорт JSON
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
                
                {/* Save button */}
                <button 
                  onClick={handleSave}
                  className="bg-primary text-white px-5 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <Save size={16} />
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-5xl mx-auto px-4 py-6 pb-24">
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Основное */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3">Основное</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Тип</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    >
                      <option value="place">Место</option>
                      <option value="service">Сервис</option>
                      <option value="specialist">Специалист</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Статус</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-primary bg-primary/5 text-primary rounded-lg"
                    >
                      <option value="unverified">🕐 На проверке</option>
                      <option value="active">✅ Активно</option>
                      <option value="flagged">⚠️ Помечено</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Название <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Zen Spa Ubud"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    value={(formData as any).short_description || ''}
                    onChange={(e) => setFormData({...formData, short_description: e.target.value})}
                    placeholder="Краткое описание места..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Если не указано - блок не отображается на странице</p>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Категория (из парсера)
                  </label>
                  <input
                    type="text"
                    value={formData.categoryName}
                    onChange={(e) => setFormData({...formData, categoryName: e.target.value})}
                    placeholder="Spa, Massage, Beauty"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">Данные приходят из Google</p>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Рейтинг Google (totalScore)
                  </label>
                  <input
                    type="text"
                    value={formData.totalScore}
                    onChange={(e) => setFormData({...formData, totalScore: e.target.value})}
                    placeholder="4.5"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">Автоматически из парсера</p>
                </div>
              </div>

              {/* Местоположение */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3">Местоположение</h3>
                
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Адрес</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Jl. Pantai Berawa 45, Canggu, Bali"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ссылка на Google Maps (url)</label>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                    placeholder="https://maps.google.com/?cid=123456789"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Широта (location.lat)</label>
                    <input
                      type="text"
                      value={formData.location.lat}
                      onChange={(e) => updateLocation('lat', e.target.value)}
                      placeholder="-8.6478"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Долгота (location.lng)</label>
                    <input
                      type="text"
                      value={formData.location.lng}
                      onChange={(e) => updateLocation('lng', e.target.value)}
                      placeholder="115.1395"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Контакты */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3">Контакты</h3>
                
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Телефон (phone)</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+62 812 3456 7890"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-gray-500 mt-1">phoneUnformatted генерируется автоматически</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Сайт (website)</label>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Изображения */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3">Изображения</h3>
                
                <div className="mb-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Главное фото (imageUrl)</label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Галерея (отдельные фото)
                  </label>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Фото 1 (не показывается в превью)</label>
                      <input
                        type="text"
                        value={(formData as any).gallery_1 || ''}
                        onChange={(e) => setFormData({...formData, gallery_1: e.target.value})}
                        placeholder="https://example.com/photo1.jpg"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Фото 2 (показывается в превью)</label>
                      <input
                        type="text"
                        value={(formData as any).gallery_2 || ''}
                        onChange={(e) => setFormData({...formData, gallery_2: e.target.value})}
                        placeholder="https://example.com/photo2.jpg"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Фото 3 (показывается в превью)</label>
                      <input
                        type="text"
                        value={(formData as any).gallery_3 || ''}
                        onChange={(e) => setFormData({...formData, gallery_3: e.target.value})}
                        placeholder="https://example.com/photo3.jpg"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Фото 4</label>
                      <input
                        type="text"
                        value={(formData as any).gallery_4 || ''}
                        onChange={(e) => setFormData({...formData, gallery_4: e.target.value})}
                        placeholder="https://example.com/photo4.jpg"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Фото 5</label>
                      <input
                        type="text"
                        value={(formData as any).gallery_5 || ''}
                        onChange={(e) => setFormData({...formData, gallery_5: e.target.value})}
                        placeholder="https://example.com/photo5.jpg"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary font-mono text-xs"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">💡 Фото 2 и 3 показываются в превью карточки</p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Часы работы */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3">Часы работы (openingHours)</h3>
                
                <div className="space-y-2">
                  {DAYS.map((day) => (
                    <div key={day} className="flex items-center gap-2">
                      <div className="w-8 text-xs font-medium text-gray-600">{DAY_LABELS[day]}</div>
                      
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={formData.openingHours?.[day]?.closed || false}
                          onChange={(e) => updateOpeningHours(day, 'closed', e.target.checked)}
                          className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                        />
                        <span className="text-xs text-gray-600">Закрыто</span>
                      </label>

                      {!formData.openingHours?.[day]?.closed && (
                        <>
                          <input
                            type="time"
                            value={formData.openingHours?.[day]?.open || '09:00'}
                            onChange={(e) => updateOpeningHours(day, 'open', e.target.value)}
                            className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-primary"
                          />
                          <span className="text-xs text-gray-500">—</span>
                          <input
                            type="time"
                            value={formData.openingHours?.[day]?.close || '18:00'}
                            onChange={(e) => updateOpeningHours(day, 'close', e.target.value)}
                            className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-primary"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Цены */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3">Цены</h3>
                
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Уровень цен</label>
                  <select
                    value={String(formData.price_level || '')}
                    onChange={(e) => setFormData({...formData, price_level: e.target.value ? Number(e.target.value) : ''})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Не указан</option>
                    <option value="1">$ - Бюджетно</option>
                    <option value="2">$$ - Средний</option>
                    <option value="3">$$$ - Выше среднего</option>
                    <option value="4">$$$$ - Премиум</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Средний чек на человека
                  </label>
                  <select
                    value={formData.average_check}
                    onChange={(e) => setFormData({...formData, average_check: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Не указан</option>
                    {AVERAGE_CHECKS.map((check) => (
                      <option key={check} value={check}>{check}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Теги */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3">Теги</h3>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Теги (placesTags, через запятую)
                  </label>
                  <input
                    type="text"
                    value={formData.placesTags?.join(', ') || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      placesTags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    })}
                    placeholder="Spa, Massage, Relax"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Hidden/System fields info */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-2 text-sm">Системные поля</h3>
                <div className="text-xs text-blue-700 space-y-1">
                  <div>• placeId — скрыт, для дедупликации</div>
                  <div>• phoneUnformatted — генерируется из phone</div>
                  <div>• reviews — массив отзывов (импорт)</div>
                  <div>• permanentlyClosed — из парсера</div>
                  <div>• temporarilyClosed — из парсера</div>
                  <div>• reviewsCount — из парсера</div>
                  <div>• additionalInfo — объект характеристик</div>
                  <div>• popularTimesHistogram — загруженность</div>
                  <div>• menu — ссылка на меню</div>
                  <div>• reserveTableUrl — бронирование</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hidden field for placeId */}
          <input type="hidden" value={formData.placeId} />

          {/* Reviews Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">💬 Отзывы</h3>
            
            {/* Reviews List */}
            {formData.reviews && formData.reviews.length > 0 && (
              <div className="mb-4 space-y-3">
                {formData.reviews.map((review: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-gray-900">{review.name || review.author || 'Аноним'}</div>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={star <= (review.stars || review.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}>
                              ⭐
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newReviews = formData.reviews.filter((_: any, i: number) => i !== index);
                          setFormData({...formData, reviews: newReviews});
                        }}
                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                    <p className="text-sm text-gray-700">{review.text || review.textTranslated || ''}</p>
                    {review.publishAt && (
                      <div className="text-xs text-gray-500 mt-2">{review.publishAt}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add New Review Form */}
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Имя автора</label>
                  <input
                    type="text"
                    id="review-author"
                    placeholder="Введите имя"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Рейтинг</label>
                  <select
                    id="review-rating"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Выберите</option>
                    <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                    <option value="4">⭐⭐⭐⭐ (4)</option>
                    <option value="3">⭐⭐⭐ (3)</option>
                    <option value="2">⭐⭐ (2)</option>
                    <option value="1">⭐ (1)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Текст отзыва</label>
                  <textarea
                    id="review-text"
                    rows={3}
                    placeholder="Введите текст отзыва"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <button
                  onClick={() => {
                    const author = (document.getElementById('review-author') as HTMLInputElement)?.value;
                    const rating = (document.getElementById('review-rating') as HTMLSelectElement)?.value;
                    const text = (document.getElementById('review-text') as HTMLTextAreaElement)?.value;
                    
                    if (!author || !rating || !text) {
                      alert('Заполните все поля');
                      return;
                    }

                    const newReview = {
                      name: author,
                      stars: Number(rating),
                      rating: Number(rating),
                      text: text,
                      publishAt: new Date().toLocaleDateString('ru-RU'),
                      created_at: new Date().toISOString(),
                    };

                    setFormData({
                      ...formData,
                      reviews: [...(formData.reviews || []), newReview]
                    });

                    // Clear form
                    (document.getElementById('review-author') as HTMLInputElement).value = '';
                    (document.getElementById('review-rating') as HTMLSelectElement).value = '';
                    (document.getElementById('review-text') as HTMLTextAreaElement).value = '';
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  + Добавить отзыв
                </button>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              💡 Отзывы из JSON импортируются автоматически при нажатии "Импорт JSON"
            </div>
          </div>

          {/* Bottom Buttons */}
          <div className="flex items-center justify-between mt-6 pb-6">
            <button 
              onClick={onClose}
              className="px-5 py-2 text-sm text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors"
            >
              Отмена
            </button>
            <button 
              onClick={handleSave}
              className="bg-primary text-white px-6 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg"
            >
              <Save size={18} />
              Создать карточку
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
