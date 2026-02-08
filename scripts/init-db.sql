-- Bali Explorer Database Schema
-- Создание таблиц для хранения заведений, изображений и отзывов

-- Таблица заведений
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
);

-- Таблица изображений
CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY,
  entity_id TEXT REFERENCES entities(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  cloudflare_id TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица отзывов
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  entity_id TEXT REFERENCES entities(id) ON DELETE CASCADE,
  author_name TEXT,
  author_photo TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_entities_category ON entities(category_name);
CREATE INDEX IF NOT EXISTS idx_entities_score ON entities(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_entities_place_id ON entities(place_id);
CREATE INDEX IF NOT EXISTS idx_images_entity ON images(entity_id, position);
CREATE INDEX IF NOT EXISTS idx_reviews_entity ON reviews(entity_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating DESC);

-- Комментарии к таблицам
COMMENT ON TABLE entities IS 'Основная таблица заведений на Бали';
COMMENT ON TABLE images IS 'Галерея изображений для каждого заведения';
COMMENT ON TABLE reviews IS 'Отзывы пользователей о заведениях';
