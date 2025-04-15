import { useEffect, useState, useRef } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type OnboardingStepProps = {
  title: string;
  description: string;
  position?: "top" | "right" | "bottom" | "left";
  elementSelector?: string;
  action?: string;
  isFirst: boolean;
  isLast: boolean;
  totalSteps: number;
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
};

export function OnboardingStep({
  title,
  description,
  position = "bottom",
  elementSelector,
  action,
  isFirst,
  isLast,
  totalSteps,
  currentStep,
  onNext,
  onPrev,
  onSkip,
}: OnboardingStepProps) {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [highlightRect, setHighlightRect] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Вычисляем координаты для позиционирования
  useEffect(() => {
    const calculatePosition = () => {
      let element = null;
      
      if (elementSelector) {
        try {
          element = document.querySelector(elementSelector);
        } catch (error) {
          console.error("Ошибка при выборе элемента:", error);
        }
      }
      
      if (element) {
        const rect = element.getBoundingClientRect();
        const tooltipHeight = tooltipRef.current?.offsetHeight || 0;
        const tooltipWidth = tooltipRef.current?.offsetWidth || 0;
        
        // Запоминаем размеры и положение выделяемого элемента
        setHighlightRect({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });

        // Позиционируем тултип в зависимости от указанной позиции
        let top = 0;
        let left = 0;

        switch (position) {
          case "top":
            top = rect.top + window.scrollY - tooltipHeight - 10;
            left = rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2;
            break;
          case "right":
            top = rect.top + window.scrollY + rect.height / 2 - tooltipHeight / 2;
            left = rect.right + window.scrollX + 10;
            break;
          case "bottom":
            top = rect.bottom + window.scrollY + 10;
            left = rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2;
            break;
          case "left":
            top = rect.top + window.scrollY + rect.height / 2 - tooltipHeight / 2;
            left = rect.left + window.scrollX - tooltipWidth - 10;
            break;
        }

        // Проверка на выход за границы экрана
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        if (left < 10) left = 10;
        if (left + tooltipWidth > windowWidth - 10) left = windowWidth - tooltipWidth - 10;
        if (top < 10) top = 10;
        if (top + tooltipHeight > windowHeight - 10) top = windowHeight - tooltipHeight - 10;

        setCoords({ top, left });
      } else {
        // Если элемент не указан или не найден, центрируем подсказку на экране
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const tooltipHeight = tooltipRef.current?.offsetHeight || 200;
        const tooltipWidth = tooltipRef.current?.offsetWidth || 300;

        setCoords({
          top: windowHeight / 2 - tooltipHeight / 2,
          left: windowWidth / 2 - tooltipWidth / 2,
        });

        // Скрываем выделение
        setHighlightRect({ top: 0, left: 0, width: 0, height: 0 });
      }
    };

    // Задержка для анимации
    const timer = setTimeout(() => {
      calculatePosition();
      setIsVisible(true);
    }, 100);

    const handleResize = () => {
      calculatePosition();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [elementSelector, position]);

  // Прокручиваем к элементу, если он существует
  useEffect(() => {
    if (elementSelector) {
      try {
        const element = document.querySelector(elementSelector);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      } catch (error) {
        console.error("Ошибка при прокрутке к элементу:", error);
      }
    }
  }, [elementSelector]);

  // Весь контент рендерится на том же уровне
  return (
    <>
      {/* Затемнение всего экрана */}
      <div
        className="fixed inset-0 bg-black/40 z-50"
        style={{ transition: "opacity 0.3s ease" }}
      />

      {/* Подсветка выделенного элемента */}
      {elementSelector && (
        <div
          className="fixed z-50 rounded-md pointer-events-none"
          style={{
            top: `${highlightRect.top}px`,
            left: `${highlightRect.left}px`,
            width: `${highlightRect.width}px`,
            height: `${highlightRect.height}px`,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.75)",
            transition: "all 0.3s ease",
          }}
        >
          <div 
            className="absolute inset-0 border-2 border-primary rounded-md"
            style={{ animation: "pulse 2s infinite" }}
          />
        </div>
      )}

      {/* Тултип с информацией */}
      <div
        ref={tooltipRef}
        className="fixed z-50 max-w-md"
        style={{
          top: `${coords.top}px`,
          left: `${coords.left}px`,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
        }}
      >
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              Шаг {currentStep + 1} из {totalSteps}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-2">{description}</p>
            {action && (
              <p className="text-sm font-medium text-primary mt-2">
                {action}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-between pt-2 border-t">
            <div className="flex gap-2">
              {!isFirst && (
                <Button variant="outline" size="sm" onClick={onPrev}>
                  Назад
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onSkip}>
                Пропустить
              </Button>
            </div>
            <Button 
              onClick={onNext}
              size="sm"
            >
              {isLast ? "Завершить" : "Далее"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}