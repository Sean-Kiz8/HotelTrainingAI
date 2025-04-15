import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowRight, Brain, ChevronLeft, ChevronRight,
  GraduationCap, LineChart, ListChecks, Star, Users
} from "lucide-react";

export default function AILearningPathPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Состояние формы
  const [userRole, setUserRole] = useState<string>("");
  const [userLevel, setUserLevel] = useState<string>("middle");
  const [userDepartment, setUserDepartment] = useState<string>("");
  const [skills, setSkills] = useState<string>("");
  const [showResultDialog, setShowResultDialog] = useState<boolean>(false);
  const [processingState, setProcessingState] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");

  // Получаем список пользователей
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<any[]>({
    queryKey: ['/api/users'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Выбранный пользователь
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Получаем список курсов для предпросмотра
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery<any[]>({
    queryKey: ['/api/courses'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Результат генерации
  const [generationResult, setGenerationResult] = useState<any | null>(null);

  // Мутация для генерации учебного пути
  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(
        "POST",
        "/api/learning-paths/generate",
        data
      );
      return await res.json();
    },
    onSuccess: (data) => {
      setGenerationResult(data);
      setProcessingState("success");
      setShowResultDialog(true);
      queryClient.invalidateQueries({ queryKey: ['/api/learning-paths'] });
    },
    onError: (error) => {
      console.error("Error generating learning path:", error);
      setProcessingState("error");
      toast({
        title: "Ошибка при генерации учебного пути",
        description: "Не удалось сгенерировать персонализированный учебный путь. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
    }
  });

  // Обработчик генерации учебного пути
  const handleGenerate = () => {
    if (!selectedUserId) {
      toast({
        title: "Выберите пользователя",
        description: "Необходимо выбрать пользователя, для которого будет создан учебный путь",
        variant: "destructive",
      });
      return;
    }

    if (!userRole || !skills) {
      toast({
        title: "Заполните все поля",
        description: "Для генерации персонализированного учебного пути необходимо заполнить все поля формы",
        variant: "destructive",
      });
      return;
    }

    setProcessingState("processing");

    // Отправка данных на сервер
    const skillsArray = skills.split(",").filter(s => s.trim() !== "").map(s => s.trim());
    console.log("Sending data to server:", {
      userId: selectedUserId,
      createdById: selectedUserId,
      userRole,
      userLevel,
      userDepartment,
      targetSkills: skillsArray
    });

    generateMutation.mutate({
      userId: selectedUserId,
      createdById: selectedUserId,
      userRole,
      userLevel,
      userDepartment,
      targetSkills: skillsArray
    });
  };

  // Перейти к сгенерированному учебному пути
  const handleViewLearningPath = () => {
    if (generationResult && generationResult.learningPath) {
      setShowResultDialog(false);
      setLocation(`/learning-path-details/${generationResult.learningPath.id}`);
    }
  };

  // Функция для отображения приоритета
  const renderPriority = (priority: string) => {
    switch (priority) {
      case "high":
        return <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded-full">Высокий</span>;
      case "low":
        return <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Низкий</span>;
      default:
        return <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">Средний</span>;
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation('/learning-paths')}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Назад к учебным планам
        </Button>
      </div>

      <PageHeader className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-6 w-6 text-primary" />
          <span className="text-sm font-medium text-primary">AI-генерация</span>
        </div>
        <PageHeaderHeading>Персонализированный учебный план</PageHeaderHeading>
        <PageHeaderDescription>
          Создайте индивидуальный учебный план с помощью искусственного интеллекта,
          учитывающий должность, уровень и целевые навыки сотрудника.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Параметры генерации</CardTitle>
              <CardDescription>
                Заполните информацию о сотруднике для создания персонализированного учебного плана.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user">Сотрудник</Label>
                  <Select
                    value={selectedUserId?.toString() || ""}
                    onValueChange={(value) => setSelectedUserId(parseInt(value))}
                  >
                    <SelectTrigger id="user">
                      <SelectValue placeholder="Выберите сотрудника" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingUsers ? (
                        <div className="flex items-center justify-center p-4">
                          <Skeleton className="h-4 w-full" />
                        </div>
                      ) : (
                        users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name || user.username}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="role">Должность</Label>
                  <Input
                    id="role"
                    placeholder="Например: Администратор ресепшн"
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="level">Уровень</Label>
                  <Select
                    value={userLevel}
                    onValueChange={(value) => setUserLevel(value)}
                  >
                    <SelectTrigger id="level">
                      <SelectValue placeholder="Выберите уровень" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="junior">Начинающий (Junior)</SelectItem>
                      <SelectItem value="middle">Средний (Middle)</SelectItem>
                      <SelectItem value="senior">Опытный (Senior)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="department">Отдел</Label>
                  <Input
                    id="department"
                    placeholder="Например: Обслуживание номеров"
                    value={userDepartment}
                    onChange={(e) => setUserDepartment(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="skills">Целевые навыки (через запятую)</Label>
                  <Textarea
                    id="skills"
                    placeholder="Например: управление конфликтами, делегирование, коммуникация с гостями"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !selectedUserId || !userRole || !skills}
                className="gap-2"
              >
                {generateMutation.isPending ? (
                  <>Генерация...</>
                ) : (
                  <>
                    Сгенерировать план
                    <Brain className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Доступные курсы</CardTitle>
              <CardDescription>
                AI подберет наиболее подходящие курсы из списка доступных.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCourses ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : courses && courses.length > 0 ? (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        className="p-3 border rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <div className="font-medium truncate">{course.title}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {course.department}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Нет доступных курсов</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Как это работает?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Анализ профиля</p>
                    <p className="text-sm text-muted-foreground">
                      AI анализирует должность, уровень и отдел сотрудника
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <ListChecks className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Подбор курсов</p>
                    <p className="text-sm text-muted-foreground">
                      AI отбирает наиболее релевантные курсы из каталога
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <LineChart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Оптимальная последовательность</p>
                    <p className="text-sm text-muted-foreground">
                      AI определяет оптимальный порядок прохождения курсов
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Диалог с результатами генерации */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Персонализированный учебный план сгенерирован</DialogTitle>
            <DialogDescription>
              AI подобрал оптимальный набор курсов для развития необходимых навыков.
            </DialogDescription>
          </DialogHeader>

          {generationResult && (
            <div className="py-4">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">{generationResult.learningPath.name}</h3>
                <p className="text-muted-foreground">{generationResult.learningPath.description}</p>

                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Целевые навыки:</h4>
                  <div className="flex flex-wrap gap-2">
                    {generationResult.details?.targetSkills?.map((skill: string, idx: number) => (
                      <div key={idx} className="bg-primary/10 px-3 py-1 rounded-full text-xs">
                        {skill}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <h4 className="text-sm font-medium mb-3">Рекомендуемые курсы:</h4>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {generationResult.courses.map((courseEntry: any) => {
                  // Находим детали курса из списка рекомендаций
                  const courseDetail = generationResult.details?.recommendedCourses?.find(
                    (c: any) => c.courseId === courseEntry.courseId
                  );

                  // Находим сам курс из общего списка
                  const course = courses.find(c => c.id === courseEntry.courseId);

                  return (
                    <Card key={courseEntry.id} className="overflow-hidden">
                      <div className="flex">
                        <div className="bg-primary/10 px-4 py-6 flex items-center justify-center">
                          <div className="font-semibold text-lg">{courseEntry.order + 1}</div>
                        </div>
                        <CardContent className="flex-1 p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{course?.title}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {course?.description}
                              </p>
                            </div>
                            <div>{renderPriority(courseEntry.priority)}</div>
                          </div>

                          {courseDetail?.rationale && (
                            <div className="mt-2 pt-2 border-t text-sm">
                              <p className="text-muted-foreground">{courseDetail.rationale}</p>
                            </div>
                          )}
                        </CardContent>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResultDialog(false)}>
              Закрыть
            </Button>
            <Button onClick={handleViewLearningPath}>
              Перейти к учебному плану
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}