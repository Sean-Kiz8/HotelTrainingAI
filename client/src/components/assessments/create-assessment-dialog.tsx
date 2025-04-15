import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAuth } from "@/context/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Схема валидации для формы
const formSchema = z.object({
  title: z.string().min(3, "Название должно содержать минимум 3 символа"),
  description: z.string().optional(),
  userId: z.string().min(1, "Выберите сотрудника"),
  roleId: z.string().min(1, "Выберите роль"),
  timeLimit: z.string().optional(),
  passingScore: z.string().min(1, "Укажите проходной балл"),
  competencies: z.array(z.string()).optional(),
  generateQuestions: z.boolean().default(true),
  questionCount: z.string().min(1, "Укажите количество вопросов"),
  targetLevel: z.string().min(1, "Выберите уровень сотрудника"),
  dueDate: z.string().optional(),
  customCompetencies: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAssessmentDialog({ open, onOpenChange }: CreateAssessmentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>([]);
  const { user } = useAuth();

  // Инициализация формы
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      userId: "",
      roleId: "",
      timeLimit: "30",
      passingScore: "70",
      competencies: [],
      generateQuestions: true,
      questionCount: "10",
      targetLevel: "middle",
      dueDate: "",
      customCompetencies: "",
    },
  });

  // Получаем список сотрудников
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["/api/users"],
    enabled: open,
  });

  // Получаем список ролей
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ["/api/employee-roles"],
    enabled: open,
  });

  // Получаем список компетенций
  const { data: competencies = [], isLoading: isLoadingCompetencies } = useQuery({
    queryKey: ["/api/competencies"],
    enabled: open,
  });

  // Получаем данные выбранного сотрудника
  const selectedUserId = form.watch("userId");
  const { data: selectedUser } = useQuery({
    queryKey: [`/api/users/${selectedUserId}`],
    enabled: !!selectedUserId && selectedUserId !== "",
  });

  // Фильтруем роли по выбранному сотруднику
  const filteredRoles = roles;

  // Добавляем состояние для пользовательских компетенций
  const [customCompetenciesList, setCustomCompetenciesList] = useState<string[]>([]);

  // Обработчик добавления пользовательской компетенции
  const handleAddCustomCompetency = () => {
    const customCompetency = form.getValues().customCompetencies;
    if (customCompetency && customCompetency.trim() !== "") {
      setCustomCompetenciesList([...customCompetenciesList, customCompetency.trim()]);
      form.setValue("customCompetencies", "");
    }
  };

  // Мутация для создания ассесмента
  const createAssessmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/assessments", data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });

      toast({
        title: "Ассесмент создан",
        description: "Новый ассесмент успешно создан",
      });

      // Если нужно сгенерировать вопросы, делаем это
      if (form.getValues().generateQuestions) {
        generateQuestionsMutation.mutate({
          assessmentId: data.id,
          count: parseInt(form.getValues().questionCount),
        });
      } else {
        onOpenChange(false);
      }

      // Если выбран сотрудник, создаем сессию ассесмента для него
      if (data.userId) {
        // Используем промис вместо await, так как мы не в async функции
        apiRequest("POST", "/api/assessment-sessions", {
          userId: parseInt(data.userId),
          assessmentId: data.id,
          status: "created"
        })
        .then(() => {
          toast({
            title: "Ассесмент назначен",
            description: `Ассесмент успешно назначен сотруднику`,
          });
        })
        .catch((error) => {
          console.error("Error assigning assessment:", error);
        });
      }
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



  // Мутация для генерации вопросов
  const generateQuestionsMutation = useMutation({
    mutationFn: async (data: { assessmentId: number; count: number }) => {
      const response = await apiRequest(
        "POST",
        `/api/assessments/${data.assessmentId}/generate-questions`,
        { count: data.count }
      );
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Вопросы сгенерированы",
        description: "Вопросы для ассесмента успешно сгенерированы",
      });
      setIsSubmitting(false);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка при генерации вопросов",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
      onOpenChange(false);
    },
  });

  // Обработчик отправки формы
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    // Проверяем наличие выбранного сотрудника
    if (!data.userId) {
      toast({
        title: "Ошибка",
        description: "Выберите сотрудника",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Проверяем, что выбрана роль
    if (!data.roleId) {
      toast({
        title: "Ошибка",
        description: "Выберите роль сотрудника",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Собираем все компетенции (выбранные и пользовательские)
    const allCompetencies = [...selectedCompetencies];

    // Преобразуем данные формы в формат для API
    const assessmentData = {
      title: data.title,
      description: data.description || "",
      roleId: parseInt(data.roleId),
      userId: parseInt(data.userId),
      timeLimit: data.timeLimit ? parseInt(data.timeLimit) : null,
      passingScore: parseInt(data.passingScore),
      targetCompetencies: selectedCompetencies.map(id => parseInt(id)),
      status: "created",
      createdById: user?.id || 1,
      targetLevel: data.targetLevel,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      customCompetencies: customCompetenciesList,
    };

    try {
      await createAssessmentMutation.mutateAsync(assessmentData);
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  // Обработчик выбора компетенций
  const handleCompetencyChange = (competencyId: string, checked: boolean) => {
    if (checked) {
      setSelectedCompetencies([...selectedCompetencies, competencyId]);
    } else {
      setSelectedCompetencies(selectedCompetencies.filter(id => id !== competencyId));
    }
  };

  // Обновляем значение компетенций в форме при изменении выбранных компетенций
  useEffect(() => {
    form.setValue("competencies", selectedCompetencies);
  }, [selectedCompetencies, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Создать новый ассесмент</DialogTitle>
          <DialogDescription>
            Заполните информацию для создания нового ассесмента. Вы можете автоматически сгенерировать вопросы с помощью ИИ.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название ассесмента</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: Оценка навыков администратора ресепшн" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Опишите цель и содержание ассесмента"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Сотрудник</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoadingEmployees}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите сотрудника" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees
                          .filter((employee: any) => employee.role !== "admin")
                          .map((employee: any) => (
                            <SelectItem key={employee.id} value={employee.id.toString()}>
                              {employee.name} ({employee.position || "Без должности"})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Роль сотрудника</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoadingRoles}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите роль" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role: any) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.title} ({role.department})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Уровень сотрудника</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите уровень" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="junior">Начинающий (Junior)</SelectItem>
                        <SelectItem value="middle">Средний (Middle)</SelectItem>
                        <SelectItem value="senior">Опытный (Senior)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passingScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Проходной балл (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="timeLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ограничение по времени (минуты)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Оставьте пустым, если нет ограничения"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Срок выполнения</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        placeholder="Выберите дату"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="generateQuestions"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-end space-x-2 space-y-0 mt-8">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Автоматически сгенерировать вопросы
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.watch("generateQuestions") && (
              <FormField
                control={form.control}
                name="questionCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Количество вопросов</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div>
              <FormLabel>Компетенции для оценки</FormLabel>
              <div className="mt-2 border rounded-md p-4 max-h-[200px] overflow-y-auto">
                {isLoadingCompetencies ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span>Загрузка компетенций...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {competencies.map((competency: any) => (
                      <div key={competency.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={`competency-${competency.id}`}
                          checked={selectedCompetencies.includes(competency.id.toString())}
                          onCheckedChange={(checked) =>
                            handleCompetencyChange(competency.id.toString(), !!checked)
                          }
                        />
                        <label
                          htmlFor={`competency-${competency.id}`}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          <div className="font-medium">{competency.name}</div>
                          <div className="text-xs text-muted-foreground">{competency.category}</div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {form.formState.errors.competencies && (
                <p className="text-sm font-medium text-destructive mt-1">
                  {form.formState.errors.competencies.message}
                </p>
              )}
            </div>

            <div>
              <FormLabel>Добавить свою компетенцию</FormLabel>
              <div className="flex items-center space-x-2 mt-2">
                <FormField
                  control={form.control}
                  name="customCompetencies"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormControl>
                        <Input
                          placeholder="Введите название компетенции"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCustomCompetency}
                >
                  Добавить
                </Button>
              </div>
              {customCompetenciesList.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-medium mb-1">Добавленные компетенции:</div>
                  <div className="flex flex-wrap gap-2">
                    {customCompetenciesList.map((competency, index) => (
                      <Badge key={index} variant="outline">
                        {competency}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Создание...
                  </>
                ) : (
                  "Создать ассесмент"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
