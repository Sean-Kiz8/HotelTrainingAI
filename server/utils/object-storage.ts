import { Client } from '@replit/object-storage';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Расширяем тип Client, чтобы добавить методы, которые есть в API, но не описаны в типах
interface EnhancedClient extends Client {
  put(key: string, value: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
}

// Инициализируем клиент Replit Object Storage
const client = new Client() as EnhancedClient;

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
    await client.put(key, fileContent);

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
    await client.put(key, thumbnailContent);

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
    const exists = await client.exists(key);
    if (!exists) {
      return null;
    }

    // Получаем содержимое файла
    const fileContent = await client.get(key);
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
    const exists = await client.exists(key);
    if (!exists) {
      return false;
    }

    // Удаляем файл
    await client.delete(key);
    return true;
  } catch (error) {
    console.error('Ошибка при удалении файла из Object Storage:', error);
    return false;
  }
}