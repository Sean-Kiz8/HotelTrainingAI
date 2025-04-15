import { useState, useEffect, createContext, ReactNode, useContext } from "react";
import { useLocalStorage } from "./use-local-storage";
import { useQuery } from "@tanstack/react-query";

// Типы для онбординга
export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  element?: string;
  position?: "top" | "right" | "bottom" | "left";
  action?: string;
};

type OnboardingContextType = {
  isOnboardingActive: boolean;
  steps: OnboardingStep[];
  currentStep: number;
  startOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
  closeOnboarding: () => void;
  isLoading: boolean;
};

// Создаем контекст с значением по умолчанию
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Провайдер для контекста
export function OnboardingProvider({ children }: { children: ReactNode }) {
  // Загружаем шаги онбординга с сервера
  const { data: steps = [], isLoading } = useQuery({
    queryKey: ["/api/onboarding"],
    queryFn: async () => {
      const response = await fetch("/api/onboarding");
      if (!response.ok) {
        throw new Error("Ошибка при загрузке данных онбординга");
      }
      const data = await response.json();
      
      // Преобразуем данные в нужный формат
      return data.map((item: any) => ({
        id: item.id.toString(),
        title: item.name || "Онбординг",
        description: item.description || "Описание шага",
        element: item.selector,
        position: item.position || "bottom",
        action: item.action,
      }));
    },
  });

  // Состояние для отслеживания активности онбординга и текущего шага
  const [isOnboardingActive, setIsOnboardingActive] = useLocalStorage("onboarding-active", false);
  const [currentStep, setCurrentStep] = useLocalStorage("onboarding-step", 0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useLocalStorage("onboarding-completed", false);

  // Сбрасываем шаг, если пользователь уже прошел онбординг ранее
  useEffect(() => {
    if (hasCompletedOnboarding) {
      setCurrentStep(0);
    }
  }, [hasCompletedOnboarding, setCurrentStep]);

  // Функция для запуска онбординга
  const startOnboarding = () => {
    setCurrentStep(0);
    setIsOnboardingActive(true);
  };

  // Функция для перехода к следующему шагу
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      closeOnboarding();
      setHasCompletedOnboarding(true);
    }
  };

  // Функция для перехода к предыдущему шагу
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Функция для пропуска онбординга
  const skipOnboarding = () => {
    closeOnboarding();
    setHasCompletedOnboarding(true);
  };

  // Функция для закрытия онбординга
  const closeOnboarding = () => {
    setIsOnboardingActive(false);
    setCurrentStep(0);
  };

  // Значение контекста
  const contextValue: OnboardingContextType = {
    isOnboardingActive,
    steps,
    currentStep,
    startOnboarding,
    nextStep,
    prevStep,
    skipOnboarding,
    closeOnboarding,
    isLoading,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}

// Хук для использования контекста онбординга
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  
  return context;
}