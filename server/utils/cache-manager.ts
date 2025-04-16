import { replitDB } from './replit-db';

/**
 * Класс для управления кешированием данных с использованием Replit DB
 */
export class CacheManager {
  readonly prefix: string;
  readonly defaultTTL: number; // время жизни кеша в секундах

  /**
   * Создает новый экземпляр менеджера кеша
   * @param prefix префикс для ключей кеша (для разделения разных типов кешированных данных)
   * @param defaultTTL время жизни кеша по умолчанию в секундах
   */
  constructor(prefix: string, defaultTTL: number = 3600) {
    this.prefix = prefix;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Форматирует ключ кеша с учетом префикса
   * @param key идентификатор кеша
   * @returns отформатированный ключ
   */
  private formatKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  /**
   * Получает данные из кеша
   * @param key идентификатор кеша
   * @returns кешированные данные или null, если данных нет или истек срок их жизни
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = this.formatKey(key);
      const cachedData = await replitDB.get(cacheKey);
      
      if (!cachedData) {
        return null;
      }
      
      // Проверяем срок действия кеша
      if (cachedData.expires && cachedData.expires < Date.now()) {
        // Кеш устарел, удаляем его
        await this.delete(key);
        return null;
      }
      
      return cachedData.data;
    } catch (error) {
      console.error(`Ошибка при получении данных из кеша для ключа ${key}:`, error);
      return null;
    }
  }

  /**
   * Сохраняет данные в кеш
   * @param key идентификатор кеша
   * @param data данные для кеширования
   * @param ttl время жизни в секундах (если не указано, используется defaultTTL)
   * @returns true в случае успеха, false в случае ошибки
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<boolean> {
    try {
      const cacheKey = this.formatKey(key);
      const expires = Date.now() + (ttl || this.defaultTTL) * 1000;
      
      const cacheData = {
        data,
        expires,
        created: Date.now()
      };
      
      return await replitDB.set(cacheKey, cacheData);
    } catch (error) {
      console.error(`Ошибка при сохранении данных в кеш для ключа ${key}:`, error);
      return false;
    }
  }

  /**
   * Удаляет данные из кеша
   * @param key идентификатор кеша
   * @returns true в случае успеха, false в случае ошибки
   */
  async delete(key: string): Promise<boolean> {
    try {
      const cacheKey = this.formatKey(key);
      return await replitDB.delete(cacheKey);
    } catch (error) {
      console.error(`Ошибка при удалении данных из кеша для ключа ${key}:`, error);
      return false;
    }
  }

  /**
   * Очищает весь кеш для текущего префикса
   * @returns количество удаленных ключей или -1 в случае ошибки
   */
  async clear(): Promise<number> {
    try {
      // Получаем все ключи с нашим префиксом
      const allKeys = await replitDB.list(this.prefix);
      
      // Удаляем каждый ключ
      let deletedCount = 0;
      for (const key of allKeys) {
        const deleted = await replitDB.delete(key);
        if (deleted) {
          deletedCount++;
        }
      }
      
      return deletedCount;
    } catch (error) {
      console.error(`Ошибка при очистке кеша для префикса ${this.prefix}:`, error);
      return -1;
    }
  }
}

// Создаем экземпляры для различных типов данных
export const coursesCache = new CacheManager('courses', 3600); // кеш курсов - 1 час
export const usersCache = new CacheManager('users', 3600 * 24); // кеш пользователей - 24 часа
export const mediaCache = new CacheManager('media', 3600 * 6); // кеш медиафайлов - 6 часов
export const analyticsCache = new CacheManager('analytics', 600); // кеш аналитики - 10 минут
export const assessmentsCache = new CacheManager('assessments', 1800); // кеш оценок - 30 минут