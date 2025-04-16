import { createContext, ReactNode, useContext } from "react";

// Тип пользователя (минимальный)
export type User = {
  id: number;
  name: string;
  username?: string;
  email?: string;
};

// Тип контекста
export type AuthContextType = {
  user: User;
  isLoading: boolean;
  error: null;
  loginMutation: any;
  logoutMutation: any;
  registerMutation: any;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Фиктивный пользователь
  const user: User = {
    id: 1,
    name: "Demo User",
    username: "demo",
    email: "demo@example.com"
  };

  // Заглушки для мутаций
  const fakeMutation = {
    mutate: () => {},
    isPending: false,
    isSuccess: true,
    isError: false,
    status: "success",
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: false,
        error: null,
        loginMutation: fakeMutation,
        logoutMutation: fakeMutation,
        registerMutation: fakeMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Если контекст не найден, возвращаем фиктивного пользователя
    return {
      user: {
        id: 1,
        name: "Demo User",
        username: "demo",
        email: "demo@example.com"
      },
      isLoading: false,
      error: null,
      loginMutation: {
        mutate: () => {},
        isPending: false,
        isSuccess: true,
        isError: false,
        status: "success",
      },
      logoutMutation: {
        mutate: () => {},
        isPending: false,
        isSuccess: true,
        isError: false,
        status: "success",
      },
      registerMutation: {
        mutate: () => {},
        isPending: false,
        isSuccess: true,
        isError: false,
        status: "success",
      },
    };
  }
  return context;
}
