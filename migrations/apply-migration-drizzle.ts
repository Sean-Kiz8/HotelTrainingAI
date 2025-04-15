import { db } from "../server/db";
import fs from "fs";
import path from "path";
import { sql } from "drizzle-orm";

async function applyMigration() {
  try {
    // Получаем имя файла миграции из аргументов командной строки или используем значение по умолчанию
    const migrationFile = process.argv[2] || 'assessment-tables.sql';
    
    // Читаем SQL-файл миграции
    const sqlContent = fs.readFileSync(path.join(process.cwd(), 'migrations', migrationFile), 'utf8');
    
    // Выполняем SQL-запрос через Drizzle
    await db.execute(sql.raw(sqlContent));
    
    console.log(`Миграция ${migrationFile} успешно применена`);
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при применении миграции:', error);
    process.exit(1);
  }
}

applyMigration();