import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// Преобразование данных из Google Places JSON в формат базы
function transformGooglePlaceData(place: any) {
  // Генерируем ID из placeId или создаём уникальный
  const id = place.placeId ? `place-${place.placeId.slice(-8)}` : `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Преобразуем openingHours из массива в объект
  const openingHours: any = {};
  if (place.openingHours && Array.isArray(place.openingHours)) {
    place.openingHours.forEach((item: any) => {
      if (item.day) {
        const dayKey = item.day.toLowerCase();
        openingHours[dayKey] = {
          open: item.hours || '',
          close: '',
          closed: false
        };
      }
    });
  }

  return {
    id,
    place_id: place.placeId || null,
    title: place.title || 'Без названия',
    category_name: place.categoryName || null,
    total_score: place.totalScore || null,
    reviews_count: place.reviewsCount || 0,
    address: place.address || null,
    phone: place.phone || null,
    website: place.website || null,
    location_lat: place.location?.lat || null,
    location_lng: place.location?.lng || null,
    average_check: place.price || null,
    opening_hours: openingHours,
    additional_info: place.additionalInfo || {},
    gallery: place.gallery || [],
    reviews: place.reviews || []
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Поддерживаем как массив, так и одиночный объект
    const places = Array.isArray(body) ? body : [body];
    
    const results = {
      succeeded: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const place of places) {
      try {
        const data = transformGooglePlaceData(place);
        
        // Вставка entity с конфликт-резолюшеном
        await sql`
          INSERT INTO entities (
            id, place_id, title, category_name, total_score, reviews_count,
            address, phone, website, location_lat, location_lng, average_check,
            opening_hours, additional_info
          ) VALUES (
            ${data.id},
            ${data.place_id},
            ${data.title},
            ${data.category_name},
            ${data.total_score},
            ${data.reviews_count},
            ${data.address},
            ${data.phone},
            ${data.website},
            ${data.location_lat},
            ${data.location_lng},
            ${data.average_check},
            ${JSON.stringify(data.opening_hours)},
            ${JSON.stringify(data.additional_info)}
          )
          ON CONFLICT (place_id) 
          DO UPDATE SET
            title = EXCLUDED.title,
            total_score = EXCLUDED.total_score,
            reviews_count = EXCLUDED.reviews_count,
            phone = EXCLUDED.phone,
            website = EXCLUDED.website,
            updated_at = NOW()
        `;
        
        // Удаляем старые изображения
        await sql`DELETE FROM images WHERE entity_id = ${data.id}`;
        
        // Вставка изображений
        if (data.gallery && Array.isArray(data.gallery)) {
          for (let i = 0; i < Math.min(data.gallery.length, 20); i++) {
            await sql`
              INSERT INTO images (entity_id, url, position)
              VALUES (${data.id}, ${data.gallery[i]}, ${i})
            `;
          }
        }
        
        // Удаляем старые отзывы
        await sql`DELETE FROM reviews WHERE entity_id = ${data.id}`;
        
        // Вставка отзывов
        if (data.reviews && Array.isArray(data.reviews)) {
          for (const review of data.reviews.slice(0, 50)) {
            await sql`
              INSERT INTO reviews (
                entity_id, author_name, author_photo, rating, text, published_at
              ) VALUES (
                ${data.id},
                ${review.name || null},
                ${review.profilePhotoUrl || null},
                ${review.rating || null},
                ${review.text || null},
                ${review.publishedAtDate ? new Date(review.publishedAtDate).toISOString() : null}
              )
            `;
          }
        }
        
        results.succeeded++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${place.title || 'Unknown'}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error(`Error processing ${place.title}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: places.length,
      ...results
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
