import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Clock,
  Users,
  Award,
  FileText,
  Calendar,
  Trash2,
  AlertCircle,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/auth-context";

export default function AssessmentDetails() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const assessmentId = parseInt(id);
  const [activeTab, setActiveTab] = useState("overview");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const { user } = useAuth();

  // Получаем данные об ассесменте
  const { data: assessment, isLoading: isLoadingAssessment } = useQuery({
    queryKey: [`/api/assessments/${assessmentId}`],
    enabled: !!assessmentId && !isNaN(assessmentId),
  });

  // Получаем вопросы для ассесмента
  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery({
    queryKey: [`/api/assessment-questions?assessmentId=${assessmentId}`],
    enabled: !!assessmentId && !isNaN(assessmentId),
  });

  // Получаем список ролей
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ["/api/employee-roles"],
  });

  // Получаем список компетенций
  const { data: competencies = [], isLoading: isLoadingCompetencies } = useQuery({
    queryKey: ["/api/competencies"],
  });

  // Мутация для удаления ассесмента
  const deleteAssessmentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/assessments/${assessmentId}`);
      if (!response.ok) {
        throw new Error("Failed to delete assessment");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      toast({
        title: "Ассесмент удален",
        description: "Ассесмент успешно удален",
      });
      navigate("/assessments");
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось удалить ассесмент",
        variant: "destructive",
      });
    },
  });

  // Мутация для создания сессии ассесмента
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      if (!user || !user.id) {
        throw new Error("Пользователь не авторизован");
      }

      console.log("Creating session for assessment ID:", assessmentId);

      const response = await apiRequest("POST", "/api/assessment-sessions", {
        assessmentId: assessmentId,
        status: "created"
      });

      return await response.json();
    },
    onSuccess: (data) => {
      // Перенаправляем на страницу сессии
      navigate(`/assessment-session/${data.id}`);
      setIsStartingSession(false);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать сессию ассесмента",
        variant: "destructive",
      });
      setIsStartingSession(false);
    },
  });

  // Обработчик удаления ассесмента
  const handleDeleteAssessment = () => {
    setIsDeleting(true);
    deleteAssessmentMutation.mutate();
  };

  // Обработчик начала ассесмента
  const handleStartAssessment = () => {
    setIsStartingSession(true);
    createSessionMutation.mutate();
  };

  // Функция для получения названия роли по ID
  const getRoleName = (roleId: number) => {
    if (!roles || roles.length === 0) return "Загрузка...";
    const role = roles.find((r: any) => r.id === roleId);
    return role ? role.title : "Неизвестная роль";
  };

  // Функция для получения отдела по ID роли
  const getRoleDepartment = (roleId: number) => {
    if (!roles || roles.length === 0) return "Загрузка...";
    const role = roles.find((r: any) => r.id === roleId);
    return role ? role.department : "Неизвестный отдел";
  };

  // Функция для форматирования статуса
  const formatStatus = (status: string) => {
    switch (status) {
      case "created":
        return "Создан";
      case "in_progress":
        return "В процессе";
      case "completed":
        return "Завершен";
      default:
        return status;
    }
  };

  // Функция для определения цвета статуса
  const getStatusColor = (status: string) => {
    switch (status) {
      case "created":
        return "secondary";
      case "in_progress":
        return "warning";
      case "completed":
        return "success";
      default:
        return "default";
    }
  };

  // Функция для получения названия компетенции по ID
  const getCompetencyName = (competencyId: any) => {
    if (!competencies || competencies.length === 0) return "Загрузка...";
    if (competencyId === null || competencyId === undefined) return "Неизвестная компетенция";

    // Обрабатываем случай, когда competencyId может быть объектом или числом
    const id = typeof competencyId === 'object' && competencyId !== null ? competencyId.id : competencyId;
    const competency = competencies.find((c: any) => c.id === id);
    return competency ? competency.name : "Неизвестная компетенция";
  };

  // Функция для форматирования сложности
  const formatDifficulty = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "Легкий";
      case "medium":
        return "Средний";
      case "hard":
        return "Сложный";
      default:
        return difficulty;
    }
  };

  // Функция для определения цвета сложности
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "success";
      case "medium":
        return "warning";
      case "hard":
        return "destructive";
      default:
        return "default";
    }
  };

  // Функция для форматирования уровня сотрудника
  const formatTargetLevel = (level: string) => {
    switch (level) {
      case "junior":
        return "Начинающий (Junior)";
      case "middle":
        return "Средний (Middle)";
      case "senior":
        return "Опытный (Senior)";
      default:
        return level || "Не указан";
    }
  };

  if (isLoadingAssessment) {
    return (
      <div className="p-4 md:p-6 pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="p-4 md:p-6 pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>
              Ассесмент не найден или был удален.
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button onClick={() => navigate('/assessments')}>
              Вернуться к списку ассесментов
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-4" onClick={() => navigate("/assessments")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{assessment.title}</h1>
            <p className="text-neutral-500">{assessment.description || "Нет описания"}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="questions">Вопросы ({questions.length})</TabsTrigger>
            <TabsTrigger value="statistics">Статистика</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Информация об ассесменте</CardTitle>
                <CardDescription>
                  Основные параметры и настройки ассесмента
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-1">Статус</h3>
                      <Badge variant={getStatusColor(assessment.status)}>
                        {formatStatus(assessment.status)}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-1">Роль</h3>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-neutral-500" />
                        <span>{getRoleName(assessment.roleId)}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-1">Отдел</h3>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-neutral-500" />
                        <span>{getRoleDepartment(assessment.roleId)}</span>
                      </div>
                    </div>

                    {assessment.targetLevel && (
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500 mb-1">Уровень сотрудника</h3>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-neutral-500" />
                          <span>{formatTargetLevel(assessment.targetLevel)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-1">Ограничение по времени</h3>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-neutral-500" />
                        <span>
                          {assessment.timeLimit
                            ? `${assessment.timeLimit} минут`
                            : "Без ограничения времени"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-1">Проходной балл</h3>
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-2 text-neutral-500" />
                        <span>{assessment.passingScore}%</span>
                      </div>
                    </div>

                    {assessment.dueDate && (
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500 mb-1">Срок выполнения</h3>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-neutral-500" />
                          <span>{new Date(assessment.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Отображение стандартных компетенций */}
                {assessment.targetCompetencies && Array.isArray(assessment.targetCompetencies) && assessment.targetCompetencies.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-neutral-500 mb-2">Оцениваемые компетенции</h3>
                    <div className="flex flex-wrap gap-2">
                      {assessment.targetCompetencies.map((competencyId: any, index: number) => {
                        // Обрабатываем случай, когда competencyId может быть объектом или числом
                        const id = typeof competencyId === 'object' && competencyId !== null ? competencyId.id : competencyId;
                        return (
                          <Badge key={`competency-${id}-${index}`} variant="outline">
                            {getCompetencyName(id)}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Отображение пользовательских компетенций */}
                {assessment.customCompetencies && Array.isArray(assessment.customCompetencies) && assessment.customCompetencies.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-neutral-500 mb-2">Дополнительные компетенции</h3>
                    <div className="flex flex-wrap gap-2">
                      {assessment.customCompetencies.map((competency: string, index: number) => (
                        <Badge key={`custom-competency-${index}`} variant="outline">
                          {competency}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <h3 className="text-sm font-medium text-neutral-500 mb-2">Дополнительная информация</h3>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Создан:</span>
                      <span>{new Date(assessment.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Последнее обновление:</span>
                      <span>{new Date(assessment.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/assessments`)}
                >
                  Вернуться к списку
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Удалить ассесмент
                  </Button>
                  <Button
                    onClick={handleStartAssessment}
                    disabled={isStartingSession}
                  >
                    {isStartingSession ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Подготовка...
                      </>
                    ) : (
                      "Начать ассесмент"
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Вопросы ассесмента</CardTitle>
                <CardDescription>
                  Список всех вопросов, включенных в ассесмент
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingQuestions ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : questions.length > 0 ? (
                  <div className="space-y-4">
                    {questions.map((question: any, index: number) => (
                      <div key={question.id} className="border rounded-md p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">Вопрос {index + 1}</h3>
                          <div className="flex gap-2">
                            <Badge variant={getDifficultyColor(question.difficulty)}>
                              {formatDifficulty(question.difficulty)}
                            </Badge>
                            <Badge variant="outline">
                              {getCompetencyName(question.competencyId)}
                            </Badge>
                          </div>
                        </div>

                        <p className="mb-4">{question.text}</p>

                        {question.type === "multiple_choice" && question.options && (
                          <div className="mb-4">
                            <div className="text-sm font-medium mb-1">Варианты ответов:</div>
                            <ul className="list-disc pl-5 space-y-1">
                              {Array.isArray(question.options) && question.options.map((option: string, i: number) => (
                                <li key={`option-${question.id}-${i}`} className={option === question.correctAnswer ? "font-medium" : ""}>
                                  {option} {option === question.correctAnswer && "(правильный)"}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {question.type === "text" && (
                          <div className="mb-4">
                            <div className="text-sm font-medium mb-1">Правильный ответ:</div>
                            <div className="p-3 bg-primary/10 rounded-md">
                              {question.correctAnswer}
                            </div>
                          </div>
                        )}

                        {question.explanation && (
                          <div>
                            <div className="text-sm font-medium mb-1">Объяснение:</div>
                            <div className="text-sm text-neutral-600">
                              {question.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-neutral-500">
                    <p>Нет вопросов для этого ассесмента</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Статистика прохождения</CardTitle>
                <CardDescription>
                  Данные о прохождении ассесмента сотрудниками
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-neutral-500">
                  <p>Статистика будет доступна после прохождения ассесмента сотрудниками</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Диалоговое окно подтверждения удаления */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить ассесмент</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить этот ассесмент? Это действие нельзя отменить.
              Все связанные данные, включая результаты прохождения, будут удалены.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAssessment}
              disabled={isDeleting}
            >
              {isDeleting ? "Удаление..." : "Удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
