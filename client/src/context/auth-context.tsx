import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";

// Type for user object without password
export type AuthUser = Omit<User, "password">;

// Тестовый пользователь-администратор (для разработки и тестирования)
const mockAdminUser: AuthUser = {
  id: 1,
  username: "admin",
  name: "Администратор",
  email: "admin@example.com",
  role: "admin",
  position: "Администратор системы",
  department: "IT",
  avatar: ""
};

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  refreshUser: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Всегда используем мок-пользователя для разработки
  const [user, setUser] = useState<AuthUser | null>(mockAdminUser);
  const [loading, setLoading] = useState(false);

  // Функция для обновления данных пользователя
  const refreshUser = async () => {
    try {
      setLoading(true);

      // Пытаемся получить актуальные данные пользователя из базы данных
      try {
        // Запрашиваем данные пользователя из API
        const response = await fetch(`/api/users/${mockAdminUser.id}`);

        if (response.ok) {
          // Если запрос успешен, обновляем данные пользователя
          const userData = await response.json();
          console.log('Получены данные пользователя из API:', userData);
          setUser(userData);
          return;
        }
      } catch (apiError) {
        console.warn('Не удалось получить данные пользователя из API:', apiError);
      }

      // Если не удалось получить данные из API, проверяем localStorage
      const updatedUserData = localStorage.getItem('updatedUserData');

      if (updatedUserData) {
        // Если есть обновленные данные, обновляем мок-пользователя
        try {
          const parsedData = JSON.parse(updatedUserData);
          setUser({ ...mockAdminUser, ...parsedData });
        } catch (e) {
          console.error('Ошибка при парсинге данных пользователя:', e);
          setUser(mockAdminUser);
        }
      } else {
        // Иначе используем стандартного мок-пользователя
        setUser(mockAdminUser);
      }
    } catch (error) {
      console.error('Ошибка при обновлении данных пользователя:', error);
      setUser(mockAdminUser);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      // В режиме разработки просто имитируем успешный вход
      setUser(mockAdminUser);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // В режиме разработки просто логируем действие и не выходим из системы
    console.log("Logout attempted - in development mode, staying logged in as mock user");
  };

  useEffect(() => {
    // Загружаем данные пользователя при инициализации
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
