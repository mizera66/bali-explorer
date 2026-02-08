import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Создание таблицы entities
    await sql`
      CREATE TABLE IF NOT EXISTS entities (
        id TEXT PRIMARY KEY,
        place_id TEXT UNIQUE,
        title TEXT NOT NULL,
        category_name TEXT,
        total_score NUMERIC(3,1),
        reviews_count INTEGER DEFAULT 0,
        address TEXT,
        phone TEXT,
        website TEXT,
        location_lat NUMERIC(10,7),
        location_lng NUMERIC(10,7),
        average_check TEXT,
        opening_hours JSONB,
        additional_info JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Создание таблицы images
    await sql`
      CREATE TABLE IF NOT EXISTS images (
        id SERIAL PRIMARY KEY,
        entity_id TEXT REFERENCES entities(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        cloudflare_id TEXT,
        position INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Создание таблицы reviews
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        entity_id TEXT REFERENCES entities(id) ON DELETE CASCADE,
        author_name TEXT,
        author_photo TEXT,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        text TEXT,
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Создание индексов
    await sql`CREATE INDEX IF NOT EXISTS idx_entities_category ON entities(category_name)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_entities_score ON entities(total_score DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_entities_place_id ON entities(place_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_images_entity ON images(entity_id, position)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_entity ON reviews(entity_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating DESC)`;

    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
