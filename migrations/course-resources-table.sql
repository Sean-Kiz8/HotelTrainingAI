-- Создание enum типа для типов ресурсов курса
CREATE TYPE course_resource_type AS ENUM ('attachment', 'reference', 'example', 'practice');

-- Создание таблицы для ресурсов курса
CREATE TABLE IF NOT EXISTS course_resources (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id),
  media_id INTEGER NOT NULL REFERENCES media_files(id),
  type course_resource_type NOT NULL DEFAULT 'attachment',
  description TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);