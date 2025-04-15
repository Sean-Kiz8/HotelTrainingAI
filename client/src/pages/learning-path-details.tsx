import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Briefcase,
  CheckCircle,
  ArrowLeft,
  Trash2,
  User,
  GraduationCap,
  BookOpen,
  AlertTriangle,
  Target
} from "lucide-react";

// Вспомогательная функция для отображения статуса
function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge className="ml-2 bg-green-500">Завершен</Badge>;
    case "active":
      return <Badge className="ml-2">Активен</Badge>;
    case "canceled":
      return <Badge variant="destructive" className="ml-2">Отменен</Badge>;
    default:
      return null;
  }
}

// Вспомогательная функция для конвертации уровня в читаемый вид
function getLevelLabel(level: string) {
  const levels: Record<string, string> = {
    junior: "Начинающий",
    middle: "Средний",
    senior: "Опытный"
  };
  return levels[level] || level;
}

// Вспомогательная функция для отображения приоритета
function getPriorityBadge(priority: string) {
  switch (priority) {
    case "high":
      return <Badge variant="destructive">Высокий</Badge>;
    case "normal":
      return <Badge variant="default">Обычный</Badge>;
    case "low":
      return <Badge variant="outline">Низкий</Badge>;
    default:
      return null;
  }
}

export default function LearningPathDetails() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("courses");
  const numericId = parseInt(id);

  // Получаем данные о плане обучения
  const { data: learningPath, isLoading } = useQuery({
    queryKey: ["/api/learning-paths", numericId],
    enabled: !isNaN(numericId),
  });

  // Получаем данные о пользователе, для которого создан план
  const { data: pathUser, isLoading: isUserLoading } = useQuery({
    queryKey: ["/api/users", learningPath?.userId],
    enabled: !!learningPath?.userId,
  });

  // Получаем данные о создателе плана
  const { data: creator, isLoading: isCreatorLoading } = useQuery({
    queryKey: ["/api/users", learningPath?.createdById],
    enabled: !!learningPath?.createdById,
  });

  // Мутация для завершения плана обучения
  const completeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/learning-paths/${numericId}/complete`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learning-paths", numericId] });
      toast({
        title: "План обучения завершен",
        description: "Статус плана изменен на 'Завершен'",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось завершить план обучения",
        variant: "destructive",
      });
    },
  });

  // Мутация для удаления плана обучения
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/learning-paths/${numericId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learning-paths"] });
      toast({
        title: "План обучения удален",
        description: "План обучения успешно удален",
      });
      navigate("/learning-paths");
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось удалить план обучения",
        variant: "destructive",
      });
    },
  });

  // Мутация для завершения курса в плане обучения
  const completeCourseInPathMutation = useMutation({
    mutationFn: async (courseId: number) => {
      return apiRequest(`/api/learning-path-courses/${courseId}/complete`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learning-paths", numericId] });
      toast({
        title: "Курс отмечен как завершенный",
        description: "Прогресс плана обучения обновлен",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось отметить курс как завершенный",
        variant: "destructive",
      });
    },
  });

  // Обработчик для завершения курса в плане обучения
  const handleCompleteCourse = (courseId: number) => {
    completeCourseInPathMutation.mutate(courseId);
  };

  // Проверяем, может ли пользователь редактировать план
  const canEdit = user?.role === "admin" || user?.id === learningPath?.createdById;

  // Если данные загружаются, показываем скелетон
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-4" onClick={() => navigate("/learning-paths")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <Skeleton className="h-8 w-1/3" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/4 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-6 w-5/6" />
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-5/6" />
                  </div>
                  
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <Skeleton className="h-6 w-1/4" />
              </CardHeader>
              <CardContent>
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="mb-6">
                    <Skeleton className="h-6 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-5/6 mb-2" />
                    <div className="flex justify-between mb-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                    <Skeleton className="h-[1px] w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-2/3" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-6 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-6 w-full" />
                </div>
                <Skeleton className="h-[1px] w-full" />
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Если план не найден, показываем сообщение
  if (!learningPath) {
    return (
      <div className="container mx-auto py-6">
        <PageHeader
          title="План обучения не найден"
          subtitle="Запрошенный план обучения не существует или был удален"
          action={
            <Button onClick={() => navigate("/learning-paths")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Вернуться к списку
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" className="mr-4" onClick={() => navigate("/learning-paths")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        <div>
          <h1 className="text-2xl font-semibold flex items-center">
            Персональный план обучения
            {getStatusBadge(learningPath.status)}
          </h1>
          <p className="text-sm text-muted-foreground">
            Создан {new Date(learningPath.createdAt).toLocaleDateString()} • ID: {learningPath.id}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Информация о плане обучения</CardTitle>
              <CardDescription>
                Детали персонального плана обучения
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Должность</div>
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-2 text-primary" />
                      <span className="font-medium">{learningPath.position}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Уровень</div>
                    <div className="flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2 text-primary" />
                      <span className="font-medium">{getLevelLabel(learningPath.level)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Сотрудник</div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-primary" />
                      <span className="font-medium">
                        {isUserLoading ? "Загрузка..." : pathUser?.name || `ID: ${learningPath.userId}`}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Целевые навыки</div>
                  <div className="flex items-start">
                    <Target className="h-4 w-4 mr-2 text-primary mt-1" />
                    <div className="font-medium">{learningPath.targetSkills}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground mb-1">Прогресс выполнения</div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Общий прогресс</span>
                    <span className="text-sm">{learningPath.progress}%</span>
                  </div>
                  <Progress value={learningPath.progress} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="mt-6"
          >
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="courses" className="flex-1 sm:flex-none">Курсы</TabsTrigger>
              <TabsTrigger value="info" className="flex-1 sm:flex-none">Дополнительная информация</TabsTrigger>
            </TabsList>
            
            <TabsContent value="courses" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Рекомендованные курсы</CardTitle>
                  <CardDescription>
                    Курсы, подобранные для этого плана обучения
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {learningPath.courses && learningPath.courses.length > 0 ? (
                    <div className="space-y-6">
                      {learningPath.courses
                        .sort((a: any, b: any) => a.order - b.order)
                        .map((item: any) => (
                          <div key={item.id} className="border-b pb-4 mb-4 last:border-0">
                            <h3 className="text-lg font-medium mb-1">{item.course.title}</h3>
                            <p className="text-sm text-muted-foreground mb-3">{item.course.description}</p>
                            <div className="flex justify-between items-center">
                              <div className="flex space-x-2">
                                {getPriorityBadge(item.priority)}
                                <Badge variant="outline">Порядок: {item.order + 1}</Badge>
                              </div>
                              <div className="flex space-x-2">
                                {item.completed ? (
                                  <Badge variant="success" className="flex items-center">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Завершен
                                  </Badge>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleCompleteCourse(item.id)}
                                    disabled={completeCourseInPathMutation.isPending}
                                  >
                                    {completeCourseInPathMutation.isPending ? "Обработка..." : "Отметить как завершенный"}
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(`/course-details/${item.course.id}`)}
                                >
                                  <BookOpen className="h-4 w-4 mr-1" />
                                  Просмотр курса
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <h3 className="text-lg font-medium mb-2">Курсы не найдены</h3>
                      <p className="text-muted-foreground">
                        В этом плане обучения пока нет рекомендованных курсов
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="info" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Дополнительная информация</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium mb-1">Создатель плана</h3>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-primary" />
                        <span>
                          {isCreatorLoading ? "Загрузка..." : creator?.name || `ID: ${learningPath.createdById}`}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-1">Даты</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground">Создан</div>
                          <div>{new Date(learningPath.createdAt).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Последнее обновление</div>
                          <div>{new Date(learningPath.updatedAt).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-1">Статус</h3>
                      <div className="flex items-center">
                        {learningPath.status === "completed" ? (
                          <CheckCircle className="h-4 w-4 mr-2 text-success" />
                        ) : learningPath.status === "active" ? (
                          <BookOpen className="h-4 w-4 mr-2 text-primary" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
                        )}
                        <span>
                          {learningPath.status === "completed" ? "Завершен" : 
                           learningPath.status === "active" ? "Активен" : "Отменен"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Действия для админа или создателя */}
              {canEdit && (
                <>
                  {learningPath.status === "active" && (
                    <Button
                      className="w-full"
                      onClick={() => completeMutation.mutate()}
                      disabled={completeMutation.isPending}
                    >
                      {completeMutation.isPending ? (
                        <>Обработка...</>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Отметить как завершенный
                        </>
                      )}
                    </Button>
                  )}
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Удалить план обучения
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Это действие навсегда удалит план обучения и все связанные с ним данные.
                          Это действие нельзя отменить.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate()}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleteMutation.isPending ? "Удаление..." : "Удалить"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
              
              {/* Действия для всех пользователей */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/learning-paths")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Вернуться к списку
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}