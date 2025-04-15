import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Award, CheckCircle, XCircle, BookOpen, BarChart3 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AssessmentResults() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const sessionId = parseInt(id);

  // Получаем данные о сессии
  const { data: session, isLoading: isLoadingSession } = useQuery({
    queryKey: [`/api/assessment-sessions/${sessionId}`],
    enabled: !!sessionId && !isNaN(sessionId),
  });

  // Получаем данные об ассесменте
  const { data: assessment, isLoading: isLoadingAssessment } = useQuery({
    queryKey: [`/api/assessments/${session?.assessmentId}`],
    enabled: !!session?.assessmentId,
  });

  // Получаем данные о пользователе
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: [`/api/users/${session?.userId}`],
    enabled: !!session?.userId,
  });

  // Получаем вопросы для ассесмента
  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery({
    queryKey: [`/api/assessment-questions?assessmentId=${session?.assessmentId}`],
    enabled: !!session?.assessmentId,
  });

  // Получаем ответы пользователя
  const { data: answers = [], isLoading: isLoadingAnswers } = useQuery({
    queryKey: [`/api/assessment-answers?sessionId=${sessionId}`],
    enabled: !!sessionId && !isNaN(sessionId),
  });

  // Получаем отчет по ассесменту
  const { data: report, isLoading: isLoadingReport } = useQuery({
    queryKey: [`/api/assessment-sessions/${sessionId}/report`],
    enabled: !!sessionId && !isNaN(sessionId) && session?.status === "completed",
  });

  // Вычисляем статистику
  const calculateStats = () => {
    if (!answers.length || !questions.length) return null;
    
    const totalQuestions = questions.length;
    const answeredQuestions = answers.length;
    const correctAnswers = answers.filter((a: any) => a.isCorrect).length;
    const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    // Группируем вопросы по компетенциям
    const competencyStats: Record<number, { total: number; correct: number; name: string }> = {};
    
    questions.forEach((q: any) => {
      if (!competencyStats[q.competencyId]) {
        const competency = q.competency || { name: "Неизвестная компетенция" };
        competencyStats[q.competencyId] = { total: 0, correct: 0, name: competency.name };
      }
      competencyStats[q.competencyId].total++;
    });
    
    // Подсчитываем правильные ответы по компетенциям
    answers.forEach((a: any) => {
      const question = questions.find((q: any) => q.id === a.questionId);
      if (question && a.isCorrect) {
        competencyStats[question.competencyId].correct++;
      }
    });
    
    // Преобразуем в массив и вычисляем проценты
    const competencyResults = Object.entries(competencyStats).map(([id, stats]) => ({
      id: parseInt(id),
      name: stats.name,
      total: stats.total,
      correct: stats.correct,
      percentage: Math.round((stats.correct / stats.total) * 100)
    }));
    
    // Сортируем по проценту выполнения (от высшего к низшему)
    competencyResults.sort((a, b) => b.percentage - a.percentage);
    
    return {
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      scorePercentage,
      competencyResults,
      isPassed: scorePercentage >= (assessment?.passingScore || 70)
    };
  };

  const stats = calculateStats();

  // Определяем уровень на основе результата
  const determineLevel = (score: number) => {
    if (score >= 90) return "senior";
    if (score >= 70) return "middle";
    return "junior";
  };

  // Форматируем уровень для отображения
  const formatLevel = (level: string) => {
    switch (level) {
      case "junior":
        return "Junior";
      case "middle":
        return "Middle";
      case "senior":
        return "Senior";
      default:
        return level;
    }
  };

  if (isLoadingSession || isLoadingAssessment || isLoadingUser || isLoadingQuestions || isLoadingAnswers) {
    return (
      <div className="p-4 md:p-6 pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-full mb-8" />
          <Skeleton className="h-64 w-full mb-4" />
        </div>
      </div>
    );
  }

  if (!session || !assessment) {
    return (
      <div className="p-4 md:p-6 pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>
              Сессия ассесмента не найдена или была удалена.
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

  if (session.status !== "completed") {
    return (
      <div className="p-4 md:p-6 pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ассесмент не завершен</AlertTitle>
            <AlertDescription>
              Этот ассесмент еще не завершен. Результаты будут доступны после завершения.
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button onClick={() => navigate(`/assessment-session/${sessionId}`)}>
              Продолжить ассесмент
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Результаты ассесмента</h1>
          <p className="text-neutral-500">{assessment.title}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Общий результат</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">{stats?.scorePercentage}%</div>
              <Progress value={stats?.scorePercentage || 0} className="h-2" />
              <div className="mt-2 flex items-center">
                {stats?.isPassed ? (
                  <Badge variant="success" className="mt-2">Пройден</Badge>
                ) : (
                  <Badge variant="destructive" className="mt-2">Не пройден</Badge>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Уровень</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Award className="h-8 w-8 mr-2 text-primary" />
                <div className="text-2xl font-bold">
                  {report?.level ? formatLevel(report.level) : formatLevel(determineLevel(stats?.scorePercentage || 0))}
                </div>
              </div>
              <p className="text-sm text-neutral-500 mt-2">
                Уровень определен на основе результатов ассесмента
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Статистика</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Всего вопросов:</span>
                  <span className="font-medium">{stats?.totalQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span>Правильных ответов:</span>
                  <span className="font-medium">{stats?.correctAnswers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Проходной балл:</span>
                  <span className="font-medium">{assessment.passingScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Дата завершения:</span>
                  <span className="font-medium">
                    {new Date(session.completedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="summary" className="mb-6">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="summary">Сводка</TabsTrigger>
            <TabsTrigger value="competencies">Компетенции</TabsTrigger>
            <TabsTrigger value="questions">Вопросы</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Сводка результатов</CardTitle>
                <CardDescription>
                  Общая оценка знаний и навыков на основе результатов ассесмента
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingReport ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : report ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-lg mb-2">Общая оценка</h3>
                      <p>{report.summary}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg mb-2">Сильные стороны</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {report.strengths.map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg mb-2">Области для улучшения</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {report.areasForImprovement.map((area, index) => (
                          <li key={index}>{area}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg mb-2">Рекомендации по обучению</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {report.recommendedLearning.map((recommendation, index) => (
                          <li key={index}>{recommendation}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <p>Отчет по ассесменту еще не сформирован</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(`/learning-path-generator?userId=${session.userId}`)}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Создать персональный план обучения
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="competencies" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Результаты по компетенциям</CardTitle>
                <CardDescription>
                  Детальный анализ результатов по каждой оцениваемой компетенции
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingReport ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : report ? (
                  <div className="space-y-6">
                    {report.competencyResults.map((competency, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium">{competency.name}</h3>
                          <Badge variant={competency.score >= 70 ? "success" : "destructive"}>
                            {competency.score}%
                          </Badge>
                        </div>
                        <Progress value={competency.score} className="h-2 mb-2" />
                        <p className="text-sm">{competency.feedback}</p>
                        {index < report.competencyResults.length - 1 && (
                          <Separator className="my-4" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : stats?.competencyResults ? (
                  <div className="space-y-6">
                    {stats.competencyResults.map((competency, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium">{competency.name}</h3>
                          <Badge variant={competency.percentage >= 70 ? "success" : "destructive"}>
                            {competency.percentage}%
                          </Badge>
                        </div>
                        <Progress value={competency.percentage} className="h-2 mb-2" />
                        <p className="text-sm">
                          {competency.correct} из {competency.total} правильных ответов
                        </p>
                        {index < stats.competencyResults.length - 1 && (
                          <Separator className="my-4" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <p>Нет данных о компетенциях</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="questions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Ответы на вопросы</CardTitle>
                <CardDescription>
                  Детальный обзор всех вопросов и ваших ответов
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {questions.map((question: any, index: number) => {
                    const answer = answers.find((a: any) => a.questionId === question.id);
                    
                    return (
                      <div key={question.id} className="border rounded-md p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">Вопрос {index + 1}</h3>
                          {answer ? (
                            answer.isCorrect ? (
                              <Badge variant="success">Правильно</Badge>
                            ) : (
                              <Badge variant="destructive">Неправильно</Badge>
                            )
                          ) : (
                            <Badge variant="outline">Нет ответа</Badge>
                          )}
                        </div>
                        
                        <p className="mb-4">{question.text}</p>
                        
                        {answer && (
                          <div className="mb-4">
                            <div className="text-sm font-medium mb-1">Ваш ответ:</div>
                            <div className="p-3 bg-neutral-100 rounded-md">
                              {answer.answer}
                            </div>
                          </div>
                        )}
                        
                        <div className="mb-4">
                          <div className="text-sm font-medium mb-1">Правильный ответ:</div>
                          <div className="p-3 bg-primary/10 rounded-md">
                            {question.correctAnswer}
                          </div>
                        </div>
                        
                        {question.explanation && (
                          <div>
                            <div className="text-sm font-medium mb-1">Объяснение:</div>
                            <div className="text-sm text-neutral-600">
                              {question.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            className="mr-2"
            onClick={() => navigate('/assessments')}
          >
            Вернуться к списку ассесментов
          </Button>
          <Button 
            onClick={() => navigate(`/employee-profile/${session.userId}`)}
          >
            Профиль сотрудника
          </Button>
        </div>
      </div>
    </div>
  );
}
