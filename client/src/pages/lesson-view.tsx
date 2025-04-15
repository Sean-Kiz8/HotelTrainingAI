import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";

export default function LessonViewPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const lessonId = params.id ? parseInt(params.id) : undefined;
  
  // Fetch lesson by ID
  const { data: lesson, isLoading, error } = useQuery<any>({
    queryKey: [`/api/lessons/${lessonId}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!lessonId
  });
  
  // Create lesson progress mutation
  const markProgressMutation = useMutation({
    mutationFn: async () => {
      if (!lesson) return null;
      
      const res = await apiRequest("POST", "/api/lesson-progress", {
        lessonId: lesson.id,
        completed: true
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Прогресс обновлен",
        description: "Урок отмечен как завершенный",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка при обновлении прогресса",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle loading state
  if (isLoading) {
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
  
  // Handle error or no lesson found
  if (error || !lesson) {
    return (
      <div className="p-4 md:p-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="mb-4"
          onClick={() => setLocation('/courses')}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Назад к курсам
        </Button>
        
        <Card className="text-center p-8">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Урок не найден</h2>
            <p className="text-muted-foreground mb-4">
              Урок с идентификатором {lessonId} не существует или был удален
            </p>
            <Button onClick={() => setLocation('/courses')}>
              Вернуться к списку курсов
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
          onClick={() => {
            if (lesson.moduleId) {
              setLocation(`/course-details/${lesson.courseId}`);
            } else {
              setLocation('/courses');
            }
          }}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Назад к курсу
        </Button>
      </div>
      
      <PageHeader className="mb-6">
        <PageHeaderHeading>{lesson.title}</PageHeaderHeading>
        <PageHeaderDescription>{lesson.description}</PageHeaderDescription>
      </PageHeader>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button
          onClick={() => markProgressMutation.mutate()}
          disabled={markProgressMutation.isPending}
        >
          Отметить как завершенный
        </Button>
      </div>
    </div>
  );
}