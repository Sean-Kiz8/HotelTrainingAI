import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { courseResourceTypeEnum, courseResources } from '../shared/schema';

// Без dotenv

async function main() {
  // Подключаемся к базе данных
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  
  const db: NodePgDatabase = drizzle(client);
  
  try {
    console.log('Применение миграции для добавления таблицы course_resources...');
    
    // Создаем enum для типов ресурсов курса, если его еще нет
    try {
      await client.query(`
        CREATE TYPE course_resource_type AS ENUM ('attachment', 'reference', 'example', 'practice')
      `);
      console.log('Создан enum course_resource_type');
    } catch (err: any) {
      if (err.code === '42710') {
        console.log('Enum course_resource_type уже существует');
      } else {
        throw err;
      }
    }
    
    // Создаем таблицу course_resources, если её еще нет
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS course_resources (
          id SERIAL PRIMARY KEY,
          course_id INTEGER NOT NULL REFERENCES courses(id),
          media_id INTEGER NOT NULL REFERENCES media_files(id),
          type course_resource_type NOT NULL DEFAULT 'attachment',
          description TEXT,
          "order" INTEGER DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log('Создана таблица course_resources');
    } catch (err) {
      console.error('Ошибка при создании таблицы course_resources:', err);
      throw err;
    }
    
    console.log('Миграция успешно применена!');
  } catch (error) {
    console.error('Ошибка при применении миграции:', error);
  } finally {
    await client.end();
  }
}

main();