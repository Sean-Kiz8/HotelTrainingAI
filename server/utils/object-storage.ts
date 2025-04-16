import { Client } from '@replit/object-storage';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Инициализируем клиент Replit Object Storage
const client = new Client();

// Обертка для методов Object Storage, которые мы будем использовать
// Так как типы в @replit/object-storage могут не полностью соответствовать реальному API
async function putObject(key: string, value: Buffer): Promise<void> {
  // @ts-ignore - игнорируем ошибки типизации
  await client.put(key, value);
}

async function getObject(key: string): Promise<Buffer | null> {
  try {
    // @ts-ignore - игнорируем ошибки типизации
    return await client.get(key);
  } catch (error) {
    console.error(`Error getting object with key ${key}:`, error);
    return null;
  }
}

async function objectExists(key: string): Promise<boolean> {
  try {
    // @ts-ignore - игнорируем ошибки типизации
    return await client.exists(key);
  } catch (error) {
    console.error(`Error checking if object with key ${key} exists:`, error);
    return false;
  }
}

async function deleteObject(key: string): Promise<boolean> {
  try {
    // @ts-ignore - игнорируем ошибки типизации
    await client.delete(key);
    return true;
  } catch (error) {
    console.error(`Error deleting object with key ${key}:`, error);
    return false;
  }
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