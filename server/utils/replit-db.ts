import fetch from 'node-fetch';

/**
 * Класс для работы с Replit Key-Value DB
 */
export class ReplitDB {
  private dbUrl: string;

  constructor() {
    this.dbUrl = process.env.REPLIT_DB_URL || '';
    if (!this.dbUrl) {
      console.warn('REPLIT_DB_URL не определен. Кеширование через Replit DB не будет работать.');
    }
  }

  /**
   * Получение значения по ключу
   * @param key Ключ для поиска
   * @returns Значение или null, если ключ не найден
   */
  async get(key: string): Promise<any | null> {
    try {
      if (!this.dbUrl) return null;
      
      const response = await fetch(`${this.dbUrl}/${encodeURIComponent(key)}`);
      if (response.status === 404) return null;
      
      const value = await response.text();
      if (!value) return null;
      
      try {
        // Пытаемся распарсить как JSON
        return JSON.parse(value);
      } catch {
        // Если не удалось распарсить, возвращаем как есть
        return value;
      }
    } catch (error) {
      console.error(`Ошибка при получении значения по ключу ${key}:`, error);
      return null;
    }
  }

  /**
   * Установка значения по ключу
   * @param key Ключ
   * @param value Значение (будет автоматически сериализовано в JSON если это объект)
   * @returns true в случае успеха, false в случае ошибки
   */
  async set(key: string, value: any): Promise<boolean> {
    try {
      if (!this.dbUrl) return false;
      
      const valueToStore = typeof value === 'object' ? JSON.stringify(value) : value;
      
      const response = await fetch(this.dbUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `${encodeURIComponent(key)}=${encodeURIComponent(valueToStore)}`,
      });
      
      return response.status === 200;
    } catch (error) {
      console.error(`Ошибка при установке значения по ключу ${key}:`, error);
      return false;
    }
  }

  /**
   * Удаление значения по ключу
   * @param key Ключ для удаления
   * @returns true в случае успеха, false в случае ошибки
   */
  async delete(key: string): Promise<boolean> {
    try {
      if (!this.dbUrl) return false;
      
      const response = await fetch(`${this.dbUrl}/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });
      
      return response.status === 200;
    } catch (error) {
      console.error(`Ошибка при удалении значения по ключу ${key}:`, error);
      return false;
    }
  }

  /**
   * Получение списка всех ключей
   * @param prefix Опциональный префикс для фильтрации ключей
   * @returns Массив ключей или пустой массив в случае ошибки
   */
  async list(prefix?: string): Promise<string[]> {
    try {
      if (!this.dbUrl) return [];
      
      const url = prefix 
        ? `${this.dbUrl}?prefix=${encodeURIComponent(prefix)}`
        : this.dbUrl;
        
      const response = await fetch(url);
      const body = await response.text();
      
      if (!body) return [];
      return body.split('\n');
    } catch (error) {
      console.error('Ошибка при получении списка ключей:', error);
      return [];
    }
  }
}

// Экспортируем экземпляр для использования в приложении
export const replitDB = new ReplitDB();