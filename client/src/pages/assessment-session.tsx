import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/auth-context";
import { AlertCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Assessment, AssessmentSession as AssessmentSessionType } from "@/types/assessment";

export default function AssessmentSession() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const sessionId = parseInt(id);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [textAnswer, setTextAnswer] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  const [autoCreatingSession, setAutoCreatingSession] = useState(false);

  // Получаем данные о сессии
  const { data: session, isLoading: isLoadingSession } = useQuery<AssessmentSessionType | undefined>({
    queryKey: [`/api/assessment-sessions/${sessionId}`],
    enabled: !!sessionId && !isNaN(sessionId),
  });

  // Получаем данные об ассесменте
  const { data: assessment, isLoading: isLoadingAssessment } = useQuery<Assessment | undefined>({
    queryKey: [`/api/assessments/${session?.assessmentId || sessionId}`],
    enabled: !!session?.assessmentId || !!sessionId,
  });

  // Получаем вопросы для ассесмента
  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery<any[]>({
    queryKey: [`/api/assessment-questions?assessmentId=${session?.assessmentId}`],
    enabled: !!session?.assessmentId,
  });

  // Получаем ответы пользователя
  const { data: answers = [], isLoading: isLoadingAnswers } = useQuery<any[]>({
    queryKey: [`/api/assessment-answers?sessionId=${sessionId}`],
    enabled: !!sessionId && !isNaN(sessionId),
  });

  // Мутация для сохранения ответа
  const saveAnswerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/assessment-answers", data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/assessment-answers?sessionId=${sessionId}`] });

      // Добавляем ответ в локальный массив
      setUserAnswers([...userAnswers, data]);

      // Показываем объяснение, если ответ неправильный
      if (!data.isCorrect) {
        setShowExplanation(true);
      } else {
        // Если ответ правильный, переходим к следующему вопросу через 1 секунду
        setTimeout(() => {
          handleNextQuestion();
        }, 1000);
      }

      // Обновляем данные сессии
      queryClient.invalidateQueries({ queryKey: [`/api/assessment-sessions/${sessionId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Мутация для завершения сессии
  const completeSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/assessment-sessions/${sessionId}/complete`, {});
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/assessment-sessions/${sessionId}`] });

      toast({
        title: "Ассесмент завершен",
        description: "Ваши результаты сохранены",
      });

      setIsSessionCompleted(true);

      // Перенаправляем на страницу результатов
      setTimeout(() => {
        navigate(`/assessment-results/${sessionId}`);
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Мутация для создания сессии ассесмента
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      if (!user || !user.id || !assessment) {
        throw new Error("Пользователь не авторизован или ассесмент не найден");
      }
      const response = await apiRequest("POST", "/api/assessment-sessions", {
        assessmentId: assessment.id,
        status: "created"
      });
      return await response.json();
    },
    onSuccess: (data: { id: number }) => {
      setAutoCreatingSession(false);
      navigate(`/assessment-session/${data.id}`);
    },
    onError: (error: Error) => {
      setAutoCreatingSession(false);
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Автоматическое создание сессии, если сессия не найдена, но пользователь — автор ассесмента
  useEffect(() => {
    if (!isLoadingSession && !session && assessment && user && assessment.createdById === user.id && !autoCreatingSession) {
      setAutoCreatingSession(true);
      createSessionMutation.mutate();
    }
  }, [isLoadingSession, session, assessment, user, autoCreatingSession, createSessionMutation]);

  // Инициализируем таймер, если есть ограничение по времени
  useEffect(() => {
    if (assessment?.timeLimit && session?.status === "in_progress" && session?.startedAt) {
      const startTime = new Date(session.startedAt).getTime();
      const timeLimit = assessment.timeLimit * 60 * 1000; // в миллисекундах
      const endTime = startTime + timeLimit;

      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, endTime - now);

        if (remaining <= 0) {
          setTimeLeft(0);
          // Автоматически завершаем сессию, если время вышло
          completeSessionMutation.mutate();
          clearInterval(timerInterval);
        } else {
          setTimeLeft(Math.floor(remaining / 1000));
        }
      };

      updateTimer();
      const timerInterval = setInterval(updateTimer, 1000);

      return () => clearInterval(timerInterval);
    }
  }, [assessment, session]);

  // Мутация для начала сессии
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/assessment-sessions/${sessionId}/start`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/assessment-sessions/${sessionId}`] });
      toast({
        title: "Ассесмент начат",
        description: "Удачи в прохождении!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Инициализируем сессию и ответы пользователя при загрузке
  useEffect(() => {
    // Если сессия в статусе "created", начинаем ее
    if (session?.status === "created") {
      startSessionMutation.mutate();
    }

    if (answers.length > 0) {
      setUserAnswers(answers);

      // Если есть ответы, устанавливаем текущий индекс вопроса
      if (answers.length < questions.length) {
        setCurrentQuestionIndex(answers.length);
      } else {
        // Если все вопросы отвечены, завершаем сессию
        setIsSessionCompleted(true);
      }
    }
  }, [session, answers, questions]);

  // Обработчик отправки ответа
  const handleSubmitAnswer = () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    const currentQuestion = questions[currentQuestionIndex];

    let answer = "";

    if (currentQuestion.type === "multiple_choice" || currentQuestion.type === "true_false") {
      answer = selectedAnswer;
    } else if (currentQuestion.type === "text_answer" || currentQuestion.type === "image_based") {
      answer = textAnswer;
    }

    if (!answer) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите или введите ответ",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const answerData = {
      sessionId,
      questionId: currentQuestion.id,
      answer,
      answeredAt: new Date().toISOString(),
    };

    saveAnswerMutation.mutate(answerData);

    // Добавляем небольшую задержку перед сбросом состояния отправки
    setTimeout(() => {
      setIsSubmitting(false);
    }, 1000);
  };

  // Обработчик перехода к следующему вопросу
  const handleNextQuestion = () => {
    setShowExplanation(false);
    setSelectedAnswer("");
    setTextAnswer("");

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Если это был последний вопрос, завершаем сессию
      completeSessionMutation.mutate();
    }
  };

  // Форматирование оставшегося времени
  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Проверяем, ответил ли пользователь на текущий вопрос
  const isCurrentQuestionAnswered = () => {
    if (!questions[currentQuestionIndex]) return false;

    return userAnswers.some(answer =>
      answer.questionId === questions[currentQuestionIndex].id
    );
  };

  // Получаем ответ пользователя на текущий вопрос
  const getCurrentQuestionAnswer = () => {
    if (!questions[currentQuestionIndex]) return null;

    return userAnswers.find(answer =>
      answer.questionId === questions[currentQuestionIndex].id
    );
  };

  // Проверяем, правильно ли ответил пользователь на текущий вопрос
  const isCurrentAnswerCorrect = () => {
    const answer = getCurrentQuestionAnswer();
    return answer ? answer.isCorrect : false;
  };

  if (isLoadingSession || isLoadingAssessment || isLoadingQuestions) {
    return (
      <div className="p-4 md:p-6 pb-24 md:pb-6">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-full mb-8" />
          <Skeleton className="h-64 w-full mb-4" />
          <div className="flex justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (!session || !assessment) {
    return (
      <div className="p-4 md:p-6 pb-24 md:pb-6">
        <div className="max-w-3xl mx-auto">
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

  if (isSessionCompleted) {
    return (
      <div className="p-4 md:p-6 pb-24 md:pb-6">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Ассесмент завершен</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto text-success mb-4" />
              <p className="text-lg mb-2">Спасибо за прохождение ассесмента!</p>
              <p className="text-neutral-500">Ваши результаты обрабатываются...</p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => navigate(`/assessment-results/${sessionId}`)}>
                Перейти к результатам
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = (currentQuestionIndex / totalQuestions) * 100;
  const currentAnswer = getCurrentQuestionAnswer();

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{assessment.title}</h1>
          <p className="text-neutral-500">{assessment.description}</p>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="text-sm">
            Вопрос {currentQuestionIndex + 1} из {totalQuestions}
          </div>

          {timeLeft !== null && (
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-1" />
              <span>Осталось времени: {formatTimeLeft(timeLeft)}</span>
            </div>
          )}
        </div>

        <Progress value={progress} className="mb-6" />

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-2">
                {currentQuestion?.text}
              </h2>

              {currentQuestion?.type === "image_based" && (
                <div className="bg-neutral-100 p-4 rounded-md mb-4 text-center text-neutral-500 italic">
                  [Здесь должно быть изображение]
                </div>
              )}
            </div>

            {currentAnswer ? (
              <div>
                <div className="mb-4">
                  <div className="font-medium mb-1">Ваш ответ:</div>
                  <div className="p-3 bg-neutral-100 rounded-md">
                    {currentAnswer.answer}
                  </div>
                </div>

                <div className="flex items-center">
                  {currentAnswer.isCorrect ? (
                    <div className="flex items-center text-success">
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      <span>Правильно!</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-destructive">
                      <XCircle className="h-5 w-5 mr-2" />
                      <span>Неправильно</span>
                    </div>
                  )}
                </div>

                {showExplanation && currentQuestion?.explanation && (
                  <div className="mt-4 p-4 bg-primary/10 rounded-md">
                    <div className="font-medium mb-1">Объяснение:</div>
                    <div>{currentQuestion.explanation}</div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {currentQuestion?.type === "multiple_choice" && (
                  <RadioGroup
                    value={selectedAnswer}
                    onValueChange={setSelectedAnswer}
                    className="space-y-3"
                  >
                    {currentQuestion.options?.map((option: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {currentQuestion?.type === "true_false" && (
                  <RadioGroup
                    value={selectedAnswer}
                    onValueChange={setSelectedAnswer}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Да" id="option-true" />
                      <Label htmlFor="option-true">Да</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Нет" id="option-false" />
                      <Label htmlFor="option-false">Нет</Label>
                    </div>
                  </RadioGroup>
                )}

                {(currentQuestion?.type === "text_answer" || currentQuestion?.type === "image_based") && (
                  <Textarea
                    placeholder="Введите ваш ответ здесь..."
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    className="min-h-[100px]"
                  />
                )}
              </>
            )}
          </CardContent>

          <CardFooter className="px-6 py-4 border-t flex justify-between">
            {currentAnswer ? (
              <Button onClick={handleNextQuestion}>
                {currentQuestionIndex < questions.length - 1 ? "Следующий вопрос" : "Завершить ассесмент"}
              </Button>
            ) : (
              <Button
                onClick={handleSubmitAnswer}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Отправка..." : "Ответить"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
