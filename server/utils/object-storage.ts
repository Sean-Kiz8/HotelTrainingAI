import { Client } from '@replit/object-storage';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Создаем директорию для локального хранения, если используем файловую систему
const LOCAL_STORAGE_DIR = './uploads/storage';
if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
  fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
}
if (!fs.existsSync(`${LOCAL_STORAGE_DIR}/media`)) {
  fs.mkdirSync(`${LOCAL_STORAGE_DIR}/media`, { recursive: true });
}
if (!fs.existsSync(`${LOCAL_STORAGE_DIR}/thumbnails`)) {
  fs.mkdirSync(`${LOCAL_STORAGE_DIR}/thumbnails`, { recursive: true });
}

// Проверка наличия Replit Object Storage
let useObjectStorage = false;
const client = new Client();

// Инициализируем клиент и проверяем, доступно ли Object Storage
(async () => {
  try {
    // Пробуем получить список объектов - если работает, значит Object Storage настроен
    try {
      const result = await client.list();
      useObjectStorage = true;
      console.log('Replit Object Storage доступен и будет использоваться');
    } catch (e) {
      console.warn('Не удалось подключиться к Replit Object Storage:', e);
      console.warn('Используется локальная файловая система для хранения файлов');
    }
  } catch (error) {
    console.warn('Ошибка при подключении к Replit Object Storage:', error);
    console.warn('Используется локальная файловая система для хранения файлов');
  }
})();

// Обертка для методов Object Storage
async function putObject(key: string, value: Buffer): Promise<void> {
  try {
    if (useObjectStorage) {
      // Используем Replit Object Storage
      try {
        await client.uploadFromBytes(key, value);
      } catch (error) {
        console.error(`Ошибка при загрузке в Object Storage: ${error}`);
        throw error;
      }
    } else {
      // Используем файловую систему
      const localPath = path.join(LOCAL_STORAGE_DIR, key);
      const dir = path.dirname(localPath);
      
      // Создаем директорию, если ее нет
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(localPath, value);
    }
  } catch (error) {
    console.error('Ошибка при загрузке файла:', error);
    
    // Как запасной вариант, всегда сохраняем в файловую систему
    const localPath = path.join(LOCAL_STORAGE_DIR, key);
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(localPath, value);
    
    console.log('Файл сохранен в локальное хранилище как запасной вариант');
  }
}

async function getObject(key: string): Promise<Buffer | null> {
  try {
    if (useObjectStorage) {
      // Попытка получить из Object Storage
      try {
        const data = await client.downloadAsBytes(key);
        // Если data не Buffer, то преобразуем
        if (data instanceof Buffer) {
          return data;
        } else if (Array.isArray(data) && data.length > 0 && data[0] instanceof Buffer) {
          return data[0];
        } else {
          console.warn(`Неожиданный формат данных из Object Storage:`, typeof data);
        }
      } catch (error) {
        console.warn(`Ошибка при получении из Object Storage: ${error}`);
      }
    }
    
    // Если не удалось получить из Object Storage или оно не используется,
    // пробуем получить из файловой системы
    const localPath = path.join(LOCAL_STORAGE_DIR, key);
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }
    
    return null;
  } catch (error) {
    console.error(`Ошибка при получении объекта с ключом ${key}:`, error);
    
    // Проверяем локальное хранилище как запасной вариант
    try {
      const localPath = path.join(LOCAL_STORAGE_DIR, key);
      if (fs.existsSync(localPath)) {
        return fs.readFileSync(localPath);
      }
    } catch (fsError) {
      console.error('Также не удалось получить из локального хранилища:', fsError);
    }
    
    return null;
  }
}

async function objectExists(key: string): Promise<boolean> {
  try {
    if (useObjectStorage) {
      // Проверяем в Object Storage
      try {
        // Пытаемся просто скачать файл - если он есть, то вернётся результат
        const data = await client.downloadAsBytes(key);
        if (data) {
          return true;
        }
      } catch (error) {
        // Если файл не найден, это нормально - просто возвращаем false
        if (error instanceof Error && error.message.includes('not found')) {
          return false;
        }
        console.warn(`Ошибка при проверке в Object Storage: ${error}`);
      }
    }
    
    // Проверяем в файловой системе
    const localPath = path.join(LOCAL_STORAGE_DIR, key);
    return fs.existsSync(localPath);
  } catch (error) {
    console.error(`Ошибка при проверке существования объекта с ключом ${key}:`, error);
    
    // Проверяем локальное хранилище как запасной вариант
    try {
      const localPath = path.join(LOCAL_STORAGE_DIR, key);
      return fs.existsSync(localPath);
    } catch (fsError) {
      console.error('Также произошла ошибка при проверке локального хранилища:', fsError);
      return false;
    }
  }
}

async function deleteObject(key: string): Promise<boolean> {
  let success = false;
  
  if (useObjectStorage) {
    try {
      // Пытаемся удалить из Object Storage
      try {
        await client.delete(key);
        success = true;
      } catch (error) {
        console.warn(`Ошибка при удалении из Object Storage: ${error}`);
      }
    } catch (error) {
      console.error(`Ошибка при удалении из Object Storage с ключом ${key}:`, error);
    }
  }
  
  try {
    // Всегда пытаемся удалить из файловой системы тоже
    const localPath = path.join(LOCAL_STORAGE_DIR, key);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
      success = true;
    }
  } catch (fsError) {
    console.error('Ошибка при удалении из локального хранилища:', fsError);
    // Если удалось удалить из Object Storage, считаем операцию успешной
  }
  
  return success;
}

// Префикс для медиафайлов
const MEDIA_PREFIX = 'media/';
const THUMBNAIL_PREFIX = 'thumbnails/';

/**
 * Загружает файл в Replit Object Storage
 * @param filePath Путь к файлу на диске
 * @param originalFilename Оригинальное имя файла
 * @param mediaType Тип медиа (image, video, document, etc.)
 * @param mimeType MIME тип файла
 * @returns Объект с информацией о загруженном файле
 */
export async function uploadFile(
  filePath: string,
  originalFilename: string,
  mediaType: string,
  mimeType: string
): Promise<{
  key: string;
  url: string;
  originalFilename: string;
  mimeType: string;
  mediaType: string;
  fileSize: number;
}> {
  try {
    // Создаем уникальный ключ для файла
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const fileExtension = path.extname(originalFilename);
    const fileName = `${timestamp}-${randomString}${fileExtension}`;
    const key = `${MEDIA_PREFIX}${fileName}`;

    // Читаем файл с диска
    const fileContent = fs.readFileSync(filePath);
    const fileSize = fileContent.length;

    // Загружаем файл в Object Storage
    await putObject(key, fileContent);

    // Формируем URL для доступа к файлу
    const url = `/api/media/file/${encodeURIComponent(key)}`;

    return {
      key,
      url,
      originalFilename,
      mimeType,
      mediaType,
      fileSize
    };
  } catch (error) {
    console.error('Ошибка при загрузке файла в Object Storage:', error);
    throw error;
  }
}

/**
 * Загружает и создает миниатюру для изображения
 * @param filePath Путь к файлу изображения
 * @param fileName Название файла для миниатюры
 * @returns URL миниатюры или null в случае ошибки
 */
export async function uploadThumbnail(
  thumbnailPath: string,
  originalFileName: string
): Promise<string | null> {
  try {
    if (!fs.existsSync(thumbnailPath)) {
      return null;
    }

    // Создаем уникальное имя для миниатюры
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(4).toString('hex');
    const fileExtension = path.extname(originalFileName);
    const thumbFileName = `thumb_${timestamp}_${randomString}${fileExtension}`;
    const key = `${THUMBNAIL_PREFIX}${thumbFileName}`;

    // Читаем и загружаем миниатюру
    const thumbnailContent = fs.readFileSync(thumbnailPath);
    await putObject(key, thumbnailContent);

    // Формируем URL для доступа к миниатюре
    const url = `/api/media/file/${encodeURIComponent(key)}`;
    return url;
  } catch (error) {
    console.error('Ошибка при загрузке миниатюры:', error);
    return null;
  }
}

/**
 * Получает файл из Object Storage по ключу
 * @param key Ключ файла в Object Storage
 * @returns Содержимое файла или null, если файл не найден
 */
export async function getFile(key: string): Promise<Buffer | null> {
  try {
    // Проверяем существование файла
    const exists = await objectExists(key);
    if (!exists) {
      return null;
    }

    // Получаем содержимое файла
    const fileContent = await getObject(key);
    return fileContent;
  } catch (error) {
    console.error('Ошибка при получении файла из Object Storage:', error);
    return null;
  }
}

/**
 * Удаляет файл из Object Storage
 * @param key Ключ файла в Object Storage
 * @returns true в случае успешного удаления, false в случае ошибки
 */
export async function deleteFile(key: string): Promise<boolean> {
  try {
    // Проверяем существование файла
    const exists = await objectExists(key);
    if (!exists) {
      return false;
    }

    // Удаляем файл
    return await deleteObject(key);
  } catch (error) {
    console.error('Ошибка при удалении файла из Object Storage:', error);
    return false;
  }
}