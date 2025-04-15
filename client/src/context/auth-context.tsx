import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";

type AuthUser = Omit<User, "password">;

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

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
  // Initialize with mock user in development
  const [user, setUser] = useState<AuthUser | null>(mockUser);
  const [loading, setLoading] = useState(false);
  
  // In a real app, we would check if user is already logged in
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
  
  const login = async (username: string, password: string) => {
    try {
      // In a real implementation, this would make an actual API call
      // For now, just use mock data
      setUser(mockUser);
      localStorage.setItem("user", JSON.stringify(mockUser));
      return Promise.resolve();
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };
  
  const logout = () => {
    // For development, we'll keep the mock user logged in
    // In production, we would uncomment these lines
    // setUser(null);
    // localStorage.removeItem("user");
    console.log("Logout clicked - in development mode, user remains logged in");
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
