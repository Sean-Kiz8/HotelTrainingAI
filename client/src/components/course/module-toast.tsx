import React from "react";
import { BookOpen, Check, ExternalLink } from "lucide-react";
import { ToastAction } from "@/components/ui/toast";
import { useLocation } from "wouter";

// Используем локальное определение интерфейса, так как модуль определен в course-details.tsx
interface IModule {
  id: number;
  title: string;
  description: string;
  courseId: number;
  orderIndex?: number;
  order?: number;
  lessons?: any[];
}

interface ModuleToastProps {
  module: IModule;
  courseId: number;
}

export function ModuleToast({ module, courseId }: ModuleToastProps) {
  const [, setLocation] = useLocation();

  const navigateToModule = () => {
    setLocation(`/course/${courseId}`);
  };

  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 p-1.5 rounded-full bg-primary/10">
        <BookOpen className="h-5 w-5 text-primary" />
      </div>

      <div className="flex-1">
        <div className="font-medium flex items-center space-x-1.5">
          <Check className="h-4 w-4 text-green-500" />
          <span>Модуль создан</span>
        </div>
        
        <div className="mt-1 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{module.title}</p>
          <p className="line-clamp-2 text-xs mt-0.5">{module.description}</p>
        </div>
      </div>

      <ToastAction 
        altText="Перейти к модулю" 
        onClick={navigateToModule}
        className="self-center"
      >
        <span className="sr-only">Перейти к модулю</span>
        <ExternalLink className="h-4 w-4" />
      </ToastAction>
    </div>
  );
}

export function LessonToast({ 
  lessonTitle, 
  moduleTitle, 
  courseId 
}: { 
  lessonTitle: string; 
  moduleTitle: string;
  courseId: number;
}) {
  const [, setLocation] = useLocation();

  const navigateToCourse = () => {
    setLocation(`/course/${courseId}`);
  };

  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 p-1.5 rounded-full bg-secondary/10">
        <BookOpen className="h-5 w-5 text-secondary" />
      </div>

      <div className="flex-1">
        <div className="font-medium flex items-center space-x-1.5">
          <Check className="h-4 w-4 text-green-500" />
          <span>Урок создан</span>
        </div>
        
        <div className="mt-1 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{lessonTitle}</p>
          <p className="text-xs mt-0.5">В модуле <span className="font-medium">{moduleTitle}</span></p>
        </div>
      </div>

      <ToastAction 
        altText="Перейти к курсу" 
        onClick={navigateToCourse}
        className="self-center"
      >
        <span className="sr-only">Перейти к курсу</span>
        <ExternalLink className="h-4 w-4" />
      </ToastAction>
    </div>
  );
}