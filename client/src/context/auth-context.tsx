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
  
  // Функция для обновления данных пользователя - в режиме разработки всегда возвращает мок-пользователя
  const refreshUser = async () => {
    // Для разработки всегда используем мок-пользователя
    setUser(mockAdminUser);
    setLoading(false);
    return;
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
    // В режиме разработки всегда используем мок пользователя
    setUser(mockAdminUser);
    setLoading(false);
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
