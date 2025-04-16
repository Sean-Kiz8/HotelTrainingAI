import fetch from 'node-fetch';

// Интерфейс для Replit DB
interface ReplitDB {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  list(prefix?: string): Promise<string[]>;
}

/**
 * Класс для работы с Replit Key-Value Store (Replit DB)
 */
class ReplitDBClient implements ReplitDB {
  private baseUrl: string;

  constructor() {
    if (!process.env.REPLIT_DB_URL) {
      console.warn('REPLIT_DB_URL не установлен. Работа с базой данных Replit может быть недоступна.');
    }
    
    this.baseUrl = process.env.REPLIT_DB_URL || 'https://kv.replit.com/v0';
  }

  /**
   * Получить значение по ключу
   * @param key ключ для поиска
   * @returns значение, сохраненное для ключа, или null, если ключ не найден
   */
  async get(key: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(key)}`);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Ошибка при получении данных: ${response.status} ${response.statusText}`);
      }
      
      const text = await response.text();
      
      try {
        // Пробуем распарсить как JSON
        return JSON.parse(text);
      } catch {
        // Если не удалось распарсить как JSON, возвращаем как есть
        return text;
      }
    } catch (error) {
      console.error(`Ошибка при получении значения для ключа ${key}:`, error);
      return null;
    }
  }

  /**
   * Установить значение для ключа
   * @param key ключ для сохранения
   * @param value значение для сохранения (объект будет сериализован в JSON)
   * @returns true в случае успеха, false в случае ошибки
   */
  async set(key: string, value: any): Promise<boolean> {
    try {
      // Преобразуем значение в строку, если это не строка
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      // Используем URLSearchParams для корректной отправки данных
      const formData = new URLSearchParams();
      formData.append('value', stringValue);
      
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });
      
      if (!response.ok) {
        // Выводим больше информации о запросе
        console.error(`Запрос к Replit DB не удался: ${response.status} ${response.statusText}`);
        console.error(`URL: ${this.baseUrl}/${encodeURIComponent(key)}`);
        console.error(`Длина данных: ${stringValue.length} символов`);
        if (stringValue.length < 1000) {
          console.error(`Данные: ${stringValue}`);
        } else {
          console.error(`Данные слишком большие для вывода`);
        }
        
        throw new Error(`Ошибка при сохранении данных: ${response.status} ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Ошибка при установке значения для ключа ${key}:`, error);
      return false;
    }
  }

  /**
   * Удалить значение по ключу
   * @param key ключ для удаления
   * @returns true в случае успеха, false в случае ошибки
   */
  async delete(key: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка при удалении данных: ${response.status} ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Ошибка при удалении значения для ключа ${key}:`, error);
      return false;
    }
  }

  /**
   * Получить список ключей с определенным префиксом
   * @param prefix опциональный префикс для фильтрации ключей
   * @returns массив ключей
   */
  async list(prefix?: string): Promise<string[]> {
    try {
      let url = `${this.baseUrl}?encode=true`;
      if (prefix) {
        url += `&prefix=${encodeURIComponent(prefix)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Ошибка при получении списка ключей: ${response.status} ${response.statusText}`);
      }
      
      const text = await response.text();
      
      if (!text) {
        return [];
      }
      
      // Replit возвращает ключи, разделенные символом новой строки
      return text.split('\n').map(key => decodeURIComponent(key));
    } catch (error) {
      console.error('Ошибка при получении списка ключей:', error);
      return [];
    }
  }
}

// Создаем и экспортируем единственный экземпляр для работы с Replit DB
export const replitDB = new ReplitDBClient();