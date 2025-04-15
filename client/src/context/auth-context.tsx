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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {}
});

// Mock user for development
const mockUser: AuthUser = {
  id: 1,
  username: "training_manager",
  name: "Елена Смирнова",
  email: "elena@hoteltrainingapp.com",
  role: "admin",
  position: "Тренинг-менеджер",
  department: "Обучение персонала",
  avatar: ""
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize with mock user for ease of development
  const [user, setUser] = useState<AuthUser | null>(mockUser);
  const [loading, setLoading] = useState(false);
  
  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      const userData = await response.json();
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };
  
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
