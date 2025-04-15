import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { useAuth } from "./use-auth";
import { useLocalStorage } from "./use-local-storage";

type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  element?: string; // CSS-селектор для выделяемого элемента
  position?: "top" | "right" | "bottom" | "left"; // Позиция подсказки относительно элемента
  action?: string; // Описание действия для пользователя
};

type OnboardingContextType = {
  isOnboardingActive: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  startOnboarding: () => void;
  skipOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  closeOnboarding: () => void;
};

const defaultSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Добро пожаловать в HotelLearn!",
    description: "Это система обучения персонала отеля. Мы проведем вас через основные функции приложения.",
    position: "bottom",
  },
  {
    id: "dashboard",
    title: "Панель управления",
    description: "Здесь вы можете видеть статистику по обучению и последние активности.",
    element: ".dashboard-stats",
    position: "bottom",
  },
  {
    id: "sidebar",
    title: "Навигация",
    description: "Используйте боковую панель для перехода между разделами системы.",
    element: ".sidebar",
    position: "right",
  },
  {
    id: "courses",
    title: "Курсы обучения",
    description: "Здесь вы найдете доступные курсы для обучения персонала.",
    element: "a[href='/courses']",
    position: "right",
    action: "Нажмите на пункт 'Курсы', чтобы перейти к списку курсов.",
  },
  {
    id: "profile",
    title: "Ваш профиль",
    description: "Здесь вы можете управлять своими настройками и видеть прогресс обучения.",
    element: ".user-profile",
    position: "bottom",
  },
  {
    id: "complete",
    title: "Готово!",
    description: "Теперь вы знаете основы использования системы. Желаем продуктивной работы!",
    position: "bottom",
  },
];

export const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useLocalStorage(
    "hasCompletedOnboarding",
    false
  );
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps] = useState<OnboardingStep[]>(defaultSteps);

  // Автоматически запускаем онбординг для новых пользователей
  useEffect(() => {
    // Запускаем онбординг только если пользователь авторизован, 
    // не завершил его ранее и находится на главной странице
    if (user && !hasCompletedOnboarding && window.location.pathname === "/") {
      // Даем немного времени для загрузки страницы
      const timer = setTimeout(() => {
        setIsOnboardingActive(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, hasCompletedOnboarding]);

  const startOnboarding = () => {
    setCurrentStep(0);
    setIsOnboardingActive(true);
  };

  const skipOnboarding = () => {
    setHasCompletedOnboarding(true);
    setIsOnboardingActive(false);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      closeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const closeOnboarding = () => {
    setHasCompletedOnboarding(true);
    setIsOnboardingActive(false);
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingActive,
        currentStep,
        steps,
        startOnboarding,
        skipOnboarding,
        nextStep,
        prevStep,
        closeOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding должен использоваться внутри OnboardingProvider");
  }
  return context;
}