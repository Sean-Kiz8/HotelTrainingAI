import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Функция для получения начального значения из localStorage или использования initialValue
  const getStoredValue = (): T => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Ошибка чтения из localStorage: ${error}`);
      return initialValue;
    }
  };

  // Инициализируем состояние полученным значением
  const [storedValue, setStoredValue] = useState<T>(getStoredValue);

  // Функция для обновления значения в state и localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Проверяем, является ли value функцией
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Обновляем состояние React
      setStoredValue(valueToStore);
      
      // Обновляем localStorage, но только если окно доступно
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Ошибка записи в localStorage: ${error}`);
    }
  };

  // Синхронизация с другими вкладками
  useEffect(() => {
    function handleStorageChange(event: StorageEvent) {
      if (event.key === key && event.newValue) {
        setStoredValue(JSON.parse(event.newValue));
      }
    }
    
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue] as const;
}