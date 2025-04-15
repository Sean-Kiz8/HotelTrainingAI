import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Course } from "@shared/schema";
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Users, Clock, Award, BookOpen } from "lucide-react";

export default function CourseDetailsPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const courseId = params.id ? parseInt(params.id) : undefined;
  
  // Fetch course by ID
  const { data: course, isLoading, error } = useQuery<Course>({
    queryKey: [`/api/courses/${courseId}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!courseId
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
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }
  
  // Handle error
  if (error || !course) {
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
            <h2 className="text-xl font-semibold mb-2">Курс не найден</h2>
            <p className="text-muted-foreground mb-4">
              Курс с идентификатором {courseId} не существует или был удален
            </p>
            <Button onClick={() => setLocation('/courses')}>
              Вернуться к списку курсов
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Определение цветов для департамента
  const getDepartmentStyles = (department: string): { bg: string, text: string } => {
    switch (department) {
      case "Обслуживание номеров":
        return { bg: "bg-primary-light", text: "text-primary" };
      case "Ресторан":
        return { bg: "bg-secondary-light", text: "text-secondary" };
      case "Адаптация":
        return { bg: "bg-accent-light", text: "text-accent" };
      default:
        return { bg: "bg-neutral-200", text: "text-neutral-700" };
    }
  };
  
  const { bg, text } = getDepartmentStyles(course.department);
  
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
      
      <PageHeader className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className={`${bg} ${text} border-0 px-2 py-1 rounded-full`}>
            {course.department}
          </Badge>
        </div>
        <PageHeaderHeading>{course.title}</PageHeaderHeading>
        <PageHeaderDescription>{course.description}</PageHeaderDescription>
      </PageHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Участников</p>
              <p className="text-lg font-medium">{course.participantCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-secondary" />
            <div>
              <p className="text-sm text-muted-foreground">Модулей</p>
              <p className="text-lg font-medium">0</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <Clock className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Длительность</p>
              <p className="text-lg font-medium">-- час.</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="content" className="mb-6">
        <TabsList>
          <TabsTrigger value="content">Содержание</TabsTrigger>
          <TabsTrigger value="students">Участники</TabsTrigger>
          <TabsTrigger value="analytics">Аналитика</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="mt-4">
          <div className="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h3 className="text-lg font-medium mb-4">Модули и уроки</h3>
            
            <div className="text-center py-12 text-muted-foreground">
              <p>У этого курса пока нет модулей</p>
              <Button className="mt-3" variant="outline">
                Добавить модуль
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="students" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Участники курса</h3>
              
              <div className="text-center py-12 text-muted-foreground">
                <p>У этого курса пока нет участников</p>
                <Button className="mt-3" variant="outline">
                  Добавить участников
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Аналитика курса</h3>
              
              <div className="text-center py-12 text-muted-foreground">
                <p>Аналитика будет доступна, когда курс начнут проходить участники</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}