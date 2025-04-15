import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Получаем строку подключения к базе данных из переменной окружения
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL не задан');
  process.exit(1);
}

// Создаем пул соединений
const pool = new Pool({ connectionString });

async function applyMigration() {
  try {
    // Получаем имя файла миграции из аргументов командной строки или используем значение по умолчанию
    const migrationFile = process.argv[2] || 'assessment-tables.sql';
    
    // Читаем SQL-файл миграции
    const sqlContent = fs.readFileSync(path.join(process.cwd(), 'migrations', migrationFile), 'utf8');
    
    // Выполняем SQL-запрос
    const result = await pool.query(sqlContent);
    
    console.log(`Миграция ${migrationFile} успешно применена`);
    
    // Закрываем соединение с базой данных
    await pool.end();
  } catch (error) {
    console.error('Ошибка при применении миграции:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

applyMigration();
