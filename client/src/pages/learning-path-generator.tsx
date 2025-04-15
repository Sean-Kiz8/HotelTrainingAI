import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, BookOpen, Award, BriefcaseBusiness } from "lucide-react";

// Схема формы для создания учебного плана
const formSchema = z.object({
  userId: z.string(),
  position: z.string().min(3, { message: "Должность должна содержать как минимум 3 символа" }),
  level: z.enum(["junior", "middle", "senior"], {
    required_error: "Пожалуйста, выберите уровень сотрудника",
  }),
  targetSkills: z.string().min(5, { message: "Опишите навыки, которые нужно развить" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function LearningPathGenerator() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);

  // Получаем список пользователей (сотрудников)
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  // Настраиваем форму
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      position: "",
      level: "junior",
      targetSkills: "",
    },
  });

  // Мутация для генерации учебного плана
  const generateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const requestData = {
        userId: parseInt(data.userId),
        createdById: user?.id,
        position: data.position,
        level: data.level,
        targetSkills: data.targetSkills,
      };
      
      return apiRequest(
        "POST",
        "/api/learning-paths/generate",
        requestData
      ).then(response => response.json());
    },
    onSuccess: (data) => {
      // Инвалидируем кеш для обновления списка учебных планов
      queryClient.invalidateQueries({ queryKey: ["/api/learning-paths"] });
      
      toast({
        title: "План обучения создан",
        description: "Персональный план обучения успешно создан с использованием ИИ",
      });
      
      // Переходим на страницу просмотра созданного плана
      navigate(`/learning-paths/${data.learningPath.id}`);
    },
    onError: (error) => {
      console.error("Ошибка при создании плана обучения:", error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать план обучения",
        variant: "destructive",
      });
    },
  });

  // Обработчик отправки формы
  const onSubmit = async (data: FormValues) => {
    setIsGenerating(true);
    try {
      await generateMutation.mutateAsync(data);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Генератор персональных учебных планов"
        subtitle="Создайте персонализированный план обучения для сотрудника с помощью искусственного интеллекта"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Создание нового плана обучения</CardTitle>
              <CardDescription>
                Заполните данные о сотруднике и целевых навыках, которые нужно развить
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Сотрудник</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={usersLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите сотрудника" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users?.map((user: any) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.name} ({user.position || "Должность не указана"})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Выберите сотрудника, для которого создается план обучения
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Должность</FormLabel>
                        <FormControl>
                          <Input placeholder="Например: Администратор, Горничная, Шеф-повар" {...field} />
                        </FormControl>
                        <FormDescription>
                          Должность сотрудника в отеле
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Текущий уровень</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите уровень сотрудника" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="junior">Начинающий (Junior)</SelectItem>
                            <SelectItem value="middle">Средний (Middle)</SelectItem>
                            <SelectItem value="senior">Опытный (Senior)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Текущий уровень квалификации сотрудника
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetSkills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Целевые навыки</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Например: работа с гостями, знание CRM-системы, стрессоустойчивость" 
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Перечислите навыки, которые нужно развить у сотрудника, через запятую
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Генерация плана обучения...
                      </>
                    ) : (
                      "Создать персональный план обучения"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>О персональных планах обучения</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start">
                <BookOpen className="h-6 w-6 mr-3 text-primary" />
                <div>
                  <h4 className="font-medium">Персонализация</h4>
                  <p className="text-sm text-muted-foreground">
                    Индивидуальный подбор курсов с учетом текущих навыков и должности
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Award className="h-6 w-6 mr-3 text-primary" />
                <div>
                  <h4 className="font-medium">Эффективность</h4>
                  <p className="text-sm text-muted-foreground">
                    Сокращение времени обучения за счет фокуса на релевантных материалах
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <BriefcaseBusiness className="h-6 w-6 mr-3 text-primary" />
                <div>
                  <h4 className="font-medium">Развитие персонала</h4>
                  <p className="text-sm text-muted-foreground">
                    Целенаправленное повышение квалификации с отслеживанием прогресса
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              <div>
                <h4 className="font-medium mb-2">Как это работает?</h4>
                <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Заполните информацию о сотруднике и требуемых навыках</li>
                  <li>Искусственный интеллект проанализирует данные и подберет оптимальные курсы</li>
                  <li>Получите готовый план обучения с приоритизацией курсов</li>
                  <li>Отслеживайте прогресс обучения сотрудника</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}