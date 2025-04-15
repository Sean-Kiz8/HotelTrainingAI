import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  name: string;
  email: string;
  department?: string;
  position?: string;
  role?: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Ошибка авторизации");
      }
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Успешный вход",
        description: `Добро пожаловать, ${user.name || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка входа",
        description: error.message || "Неверное имя пользователя или пароль",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Ошибка регистрации");
      }
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Регистрация успешна",
        description: `Аккаунт создан для ${user.name || user.username}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка регистрации",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Выход выполнен",
        description: "Вы успешно вышли из системы",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка выхода",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  // Возвращаем заглушку, если контекст недоступен
  if (!context) {
    return {
      user: null,
      isLoading: false,
      error: null,
      loginMutation: {
        mutate: () => {
          console.warn("AuthProvider не найден. Перенаправление на страницу входа...");
          window.location.href = "/auth";
        },
        isPending: false,
        isSuccess: false,
        isError: false,
        status: "idle",
      } as any,
      logoutMutation: {
        mutate: () => {
          console.warn("AuthProvider не найден. Перенаправление на страницу входа...");
          window.location.href = "/auth";
        },
        isPending: false,
        isSuccess: false,
        isError: false,
        status: "idle",
      } as any,
      registerMutation: {
        mutate: () => {
          console.warn("AuthProvider не найден. Перенаправление на страницу входа...");
          window.location.href = "/auth";
        },
        isPending: false,
        isSuccess: false,
        isError: false,
        status: "idle",
      } as any,
    };
  }
  
  return context;
}