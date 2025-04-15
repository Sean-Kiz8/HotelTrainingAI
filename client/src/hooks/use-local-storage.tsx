import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Получаем значение из локального хранилища или используем начальное значение
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return initialValue;
    }
  });

  // Устанавливаем значение в локальное хранилище при изменении storedValue или key
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error("Error writing to localStorage:", error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}