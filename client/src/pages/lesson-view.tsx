import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Video, File, ExternalLink, CheckCircle, Clock } from "lucide-react";

export default function LessonViewPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const lessonId = params.id ? parseInt(params.id) : undefined;
  
  // Получаем урок
  const { data: lesson, isLoading: isLoadingLesson, error } = useQuery({
    queryKey: [`/api/lessons/${lessonId}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!lessonId
  });
  
  // Получаем модуль для этого урока
  const { data: module, isLoading: isLoadingModule } = useQuery({
    queryKey: [`/api/modules/${lesson?.moduleId}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!lesson?.moduleId
  });
  
  // Запоминаем id курса для возврата назад
  const courseId = module?.courseId;
  
  // Отмечаем прогресс просмотра урока
  useEffect(() => {
    if (lesson && !isLoadingLesson) {
      // В будущем здесь будет логика записи прогресса
      console.log("Урок просмотрен:", lesson.id);
    }
  }, [lesson, isLoadingLesson]);
  
  // Отображаем состояние загрузки
  if (isLoadingLesson || isLoadingModule) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-12 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-6" />
        <Skeleton className="h-64 w-full mb-4" />
      </div>
    );
  }
  
  // Обрабатываем ошибку
  if (error || !lesson) {
    return (
      <div className="p-4 md:p-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="mb-4"
          onClick={() => setLocation(courseId ? `/course-details/${courseId}` : '/courses')}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Назад к курсу
        </Button>
        
        <Card className="text-center p-8">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Урок не найден</h2>
            <p className="text-muted-foreground mb-4">
              Урок с идентификатором {lessonId} не существует или был удален
            </p>
            <Button onClick={() => setLocation(courseId ? `/course-details/${courseId}` : '/courses')}>
              Вернуться к курсу
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setLocation(`/course-details/${courseId}`)}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Назад к курсу
        </Button>
      </div>
      
      <PageHeader className="mb-6">
        <PageHeaderHeading>{lesson.title}</PageHeaderHeading>
        {lesson.description && (
          <PageHeaderDescription>{lesson.description}</PageHeaderDescription>
        )}
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          {module && (
            <div className="flex items-center">
              <span>Модуль: {module.title}</span>
            </div>
          )}
          {lesson.durationMinutes && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{lesson.durationMinutes} мин.</span>
            </div>
          )}
        </div>
      </PageHeader>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Основной контент урока */}
        <div className="col-span-1 lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              {/* Контент урока */}
              <div className="prose max-w-none">
                {lesson.content ? (
                  <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                ) : (
                  <p className="text-muted-foreground">Содержимое урока отсутствует</p>
                )}
              </div>
              
              {/* Медиа-файлы урока */}
              {lesson.media && lesson.media.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Материалы урока</h3>
                  <div className="space-y-3">
                    {lesson.media.map((media: any) => (
                      <div key={media.id} className="flex items-center p-3 border rounded-md">
                        {media.mediaType === 'video' ? (
                          <Video className="h-5 w-5 mr-3 text-blue-500" />
                        ) : (
                          <File className="h-5 w-5 mr-3 text-blue-500" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{media.title || media.filename}</p>
                          <p className="text-sm text-muted-foreground">{media.description || ''}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/uploads/${media.path}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Открыть
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Кнопка "Завершить урок" */}
              <div className="mt-8 flex justify-end">
                <Button 
                  className="flex items-center"
                  onClick={() => {
                    toast({
                      title: "Урок завершен",
                      description: "Ваш прогресс сохранен",
                    });
                    // В будущем отправка завершения на сервер
                    setLocation(`/course-details/${courseId}`);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Отметить как завершенный
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Навигация и дополнительные материалы */}
        <div className="col-span-1">
          <Card className="sticky top-6">
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Навигация по курсу</h3>
              
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left"
                  onClick={() => setLocation(`/course-details/${courseId}`)}
                >
                  <span className="truncate">Вернуться к обзору курса</span>
                </Button>
                
                {/* Здесь в будущем будет навигация по урокам */}
                <Separator className="my-3" />
                
                <div className="text-sm text-muted-foreground">
                  <p>Функция навигации между уроками находится в разработке</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}