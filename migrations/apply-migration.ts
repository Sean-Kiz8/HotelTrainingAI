import { Pool, neonConfig } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import ws from 'ws';

// Настройка для Neon
neonConfig.webSocketConstructor = ws;

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
    // Читаем SQL-файл миграции
    const sqlContent = fs.readFileSync(path.join(process.cwd(), 'migrations', 'add_preferences_to_users.sql'), 'utf8');
    
    console.log('Выполняем SQL-запрос:', sqlContent);
    
    // Выполняем SQL-запрос
    const result = await pool.query(sqlContent);
    
    console.log('Миграция успешно применена');
    console.log(result);
    
    // Закрываем соединение с базой данных
    await pool.end();
  } catch (error) {
    console.error('Ошибка при применении миграции:', error);
    process.exit(1);
  }
}

applyMigration();
