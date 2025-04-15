import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";

// Type for user object without password
export type AuthUser = Omit<User, "password">;

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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Функция для обновления данных пользователя с сервера
  const refreshUser = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user");
      
      if (response.status === 200) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        setUser(null);
        localStorage.removeItem("user");
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      setUser(null);
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  };
  
  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiRequest("POST", "/api/login", { username, password });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        throw new Error("Неверное имя пользователя или пароль");
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
      setUser(null);
      localStorage.removeItem("user");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  
  useEffect(() => {
    // При первом запуске приложения проверяем авторизацию
    const loadUser = async () => {
      const storedUser = localStorage.getItem("user");
      
      if (storedUser) {
        try {
          // Временно установим пользователя из localStorage
          setUser(JSON.parse(storedUser));
          
          // И затем сделаем запрос на сервер для проверки сессии
          await refreshUser();
        } catch (error) {
          console.error("Failed to parse stored user:", error);
          localStorage.removeItem("user");
          setUser(null);
        }
      } else {
        await refreshUser();
      }
      
      setLoading(false);
    };
    
    loadUser();
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
