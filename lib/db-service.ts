// lib/db-service.ts
import { sql } from '@vercel/postgres';
import { Entity } from '@/data/db';

// Преобразование данных из Postgres в формат Entity
function transformEntityFromDB(row: any): Entity {
  // Дебаг: смотрим что приходит
  console.log('RAW ROW:', {
    id: row.id,
    title: row.title,
    gallery_raw: row.gallery,
    gallery_type: typeof row.gallery
  });
  
  // Парсим JSON поля если они строки
  const openingHours = typeof row.opening_hours === 'string' 
    ? JSON.parse(row.opening_hours) 
    : row.opening_hours;
    
  const additionalInfo = typeof row.additional_info === 'string'
    ? JSON.parse(row.additional_info)
    : row.additional_info;
    
  // Парсим gallery если строка
  let gallery: string[] = [];
  if (typeof row.gallery === 'string') {
    try {
      gallery = JSON.parse(row.gallery);
      console.log('PARSED GALLERY from string:', gallery);
    } catch (e) {
      console.error('Failed to parse gallery:', e);
      gallery = [];
    }
  } else if (Array.isArray(row.gallery)) {
    gallery = row.gallery;
    console.log('GALLERY is array:', gallery);
  } else {
    console.log('GALLERY is neither string nor array:', row.gallery);
  }
  
  const result: Entity = {
    id: row.id,
    title: row.title,
    type: 'place',
    area: row.category_name || '',
    short_description: '',
    address_text: row.address || '',
    geo_lat: parseFloat(row.location_lat) || undefined,
    geo_lng: parseFloat(row.location_lng) || undefined,
    contacts: {
      phone: row.phone || undefined,
      website: row.website || undefined,
    },
    price_level: 2,
    tags: [],
    rating: parseFloat(row.total_score) || 0,
    rating_count: row.reviews_count || 0,
    last_confirmed_at: new Date().toISOString(),
    status: 'active',
    created_at: row.created_at?.toISOString ? row.created_at.toISOString() : row.created_at,
    updated_at: row.updated_at?.toISOString ? row.updated_at.toISOString() : row.updated_at,
    created_by: 'system',
    image_url: gallery && gallery.length > 0 ? gallery[0] : undefined,
    gallery: gallery,
    work_hours: openingHours || undefined,
    average_check: row.average_check || undefined,
  };
  
  console.log('RESULT image_url:', result.image_url, 'gallery length:', result.gallery?.length);
  
  return result;
}

export const dbService = {
  // Entities
  getEntities: async (filters?: {
    type?: string;
    area?: string;
    tags?: string[];
    search?: string;
    status?: string;
  }): Promise<Entity[]> => {
    try {
      let query = `
        SELECT e.*, 
               COALESCE(
                 json_agg(i.url ORDER BY i.position) FILTER (WHERE i.id IS NOT NULL),
                 '[]'::json
               ) as gallery
        FROM entities e
        LEFT JOIN images i ON e.id = i.entity_id
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramIndex = 1;

      if (filters?.type) {
        query += ` AND e.category_name = $${paramIndex}`;
        params.push(filters.type);
        paramIndex++;
      }

      if (filters?.search) {
        query += ` AND (e.title ILIKE $${paramIndex} OR e.address ILIKE $${paramIndex})`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      query += ` GROUP BY e.id ORDER BY e.total_score DESC NULLS LAST`;

      const result = await sql.query(query, params);
      
      return result.rows.map(transformEntityFromDB);
    } catch (error) {
      console.error('Error in getEntities:', error);
      return [];
    }
  },

  getEntity: async (id: string): Promise<Entity | undefined> => {
    try {
      const result = await sql`
        SELECT e.*, 
               COALESCE(
                 json_agg(i.url ORDER BY i.position) FILTER (WHERE i.id IS NOT NULL),
                 '[]'::json
               ) as gallery
        FROM entities e
        LEFT JOIN images i ON e.id = i.entity_id
        WHERE e.id = ${id}
        GROUP BY e.id
      `;
      
      if (result.rows.length === 0) return undefined;
      
      return transformEntityFromDB(result.rows[0]);
    } catch (error) {
      console.error('Error in getEntity:', error);
      return undefined;
    }
  },

  createEntity: async (entity: Omit<Entity, 'id' | 'created_at' | 'updated_at'>): Promise<Entity> => {
    try {
      const id = `entity-${Date.now()}`;
      
      await sql`
        INSERT INTO entities (
          id, title, category_name, total_score, reviews_count,
          address, phone, website, location_lat, location_lng,
          average_check, opening_hours, additional_info
        ) VALUES (
          ${id},
          ${entity.title},
          ${entity.type || null},
          ${entity.rating || null},
          ${entity.rating_count || 0},
          ${entity.address_text || null},
          ${entity.contacts?.phone || null},
          ${entity.contacts?.website || null},
          ${entity.geo_lat || null},
          ${entity.geo_lng || null},
          ${entity.average_check || null},
          ${JSON.stringify(entity.work_hours || {})},
          ${JSON.stringify({})}
        )
      `;

      // Добавляем изображения
      if (entity.gallery && entity.gallery.length > 0) {
        for (let i = 0; i < entity.gallery.length; i++) {
          await sql`
            INSERT INTO images (entity_id, url, position)
            VALUES (${id}, ${entity.gallery[i]}, ${i})
          `;
        }
      }

      const created = await dbService.getEntity(id);
      return created!;
    } catch (error) {
      console.error('Error in createEntity:', error);
      throw error;
    }
  },

  updateEntity: async (id: string, updates: Partial<Entity>): Promise<Entity | undefined> => {
    try {
      await sql`
        UPDATE entities 
        SET 
          title = COALESCE(${updates.title || null}, title),
          category_name = COALESCE(${updates.type || null}, category_name),
          total_score = COALESCE(${updates.rating || null}, total_score),
          reviews_count = COALESCE(${updates.rating_count || null}, reviews_count),
          updated_at = NOW()
        WHERE id = ${id}
      `;

      return await dbService.getEntity(id);
    } catch (error) {
      console.error('Error in updateEntity:', error);
      return undefined;
    }
  },

  deleteEntity: async (id: string): Promise<boolean> => {
    try {
      await sql`DELETE FROM entities WHERE id = ${id}`;
      return true;
    } catch (error) {
      console.error('Error in deleteEntity:', error);
      return false;
    }
  },

  // Signals - пока заглушки, можешь удалить если не нужны
  addSignal: async (signal: any): Promise<any> => {
    return signal;
  },

  getSignals: async (entity_id?: string): Promise<any[]> => {
    return [];
  },

  // Guides - пока заглушки
  getGuides: async (category?: string): Promise<any[]> => {
    return [];
  },

  getGuide: async (id: string): Promise<any | undefined> => {
    return undefined;
  },

  // Areas (extract unique areas)
  getAreas: async (): Promise<string[]> => {
    try {
      const result = await sql`
        SELECT DISTINCT category_name 
        FROM entities 
        WHERE category_name IS NOT NULL 
        ORDER BY category_name
      `;
      return result.rows.map(r => r.category_name);
    } catch (error) {
      console.error('Error in getAreas:', error);
      return [];
    }
  },

  // Tags (extract unique tags)
  getTags: async (): Promise<string[]> => {
    return [];
  },

  // Popular entities
  getPopular: async (limit: number = 6): Promise<Entity[]> => {
    try {
      const result = await sql`
        SELECT e.*, 
               COALESCE(
                 json_agg(i.url ORDER BY i.position) FILTER (WHERE i.id IS NOT NULL),
                 '[]'::json
               ) as gallery
        FROM entities e
        LEFT JOIN images i ON e.id = i.entity_id
        GROUP BY e.id
        ORDER BY e.total_score DESC NULLS LAST
        LIMIT ${limit}
      `;
      
      return result.rows.map(transformEntityFromDB);
    } catch (error) {
      console.error('Error in getPopular:', error);
      return [];
    }
  },

  // Reset database (for testing)
  reset: async () => {
    // Не реализовано для production
  },
};
