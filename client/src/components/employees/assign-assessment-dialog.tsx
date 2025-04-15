import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface AssignAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: number;
  employeeName: string;
}

export function AssignAssessmentDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName
}: AssignAssessmentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Получаем данные сотрудника для определения его роли
  const { data: employee } = useQuery({
    queryKey: [`/api/users/${employeeId}`],
    enabled: open && !!employeeId,
  });

  // Получаем все ассесменты
  const { data: assessments = [], isLoading: isLoadingAssessments } = useQuery({
    queryKey: ["/api/assessments"],
    enabled: open,
  });

  // Получаем сессии ассесментов для сотрудника
  const { data: assessmentSessions = [], isLoading: isLoadingAssessmentSessions } = useQuery({
    queryKey: [`/api/assessment-sessions?userId=${employeeId}`],
    enabled: open && !!employeeId,
  });

  // Фильтруем ассесменты по поисковому запросу и роли сотрудника
  const filteredAssessments = assessments.filter((assessment: any) => {
    // Проверяем, что ассесмент соответствует поисковому запросу
    const matchesSearch = !searchQuery ||
      assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Проверяем, что сотрудник еще не проходил этот ассесмент или не имеет активной сессии
    const isNotAssigned = !assessmentSessions.some((session: any) =>
      session.assessmentId === assessment.id &&
      (session.status === "in_progress" || session.status === "created")
    );

    // Проверяем соответствие роли сотрудника
    const matchesRole = !assessment.roleId ||
      assessment.roleId === employee?.roleId;

    return matchesSearch && isNotAssigned && matchesRole;
  });

  // Мутация для создания сессии ассесмента
  const createSessionMutation = useMutation({
    mutationFn: async (assessmentId: number) => {
      const response = await fetch("/api/assessment-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: employeeId,
          assessmentId: assessmentId,
          status: "created"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Не удалось назначить ассесмент");
      }

      return response.json();
    },
    onSuccess: () => {
      // Инвалидируем кэш запросов, чтобы обновить данные
      queryClient.invalidateQueries({ queryKey: [`/api/assessment-sessions?userId=${employeeId}`] });

      toast({
        title: "Ассесмент назначен",
        description: `Сотруднику успешно назначен ассесмент`,
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

  // Обработчик назначения ассесмента
  const handleAssignAssessment = (assessmentId: number, assessmentTitle: string) => {
    createSessionMutation.mutate(assessmentId);
    toast({
      title: "Назначение ассесмента",
      description: `Назначен ассесмент "${assessmentTitle}" для сотрудника ${employeeName}`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Назначить ассесмент</DialogTitle>
          <DialogDescription>
            Выберите ассесмент для оценки навыков сотрудника {employeeName}
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <Input
            placeholder="Поиск ассесментов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {isLoadingAssessments || isLoadingAssessmentSessions ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : filteredAssessments.length > 0 ? (
            <div className="space-y-3">
              {filteredAssessments.map((assessment: any) => (
                <div
                  key={assessment.id}
                  className="border rounded-md p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{assessment.title}</h4>
                      <p className="text-sm text-neutral-500 line-clamp-2 mt-1">
                        {assessment.description || "Нет описания"}
                      </p>
                      <div className="mt-2">
                        <Badge variant="outline">
                          {assessment.timeLimit ? `${assessment.timeLimit} мин` : "Без ограничения времени"}
                        </Badge>
                        <Badge variant="outline" className="ml-2">
                          Проходной балл: {assessment.passingScore}%
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAssignAssessment(assessment.id, assessment.title)}
                      disabled={createSessionMutation.isPending}
                    >
                      Назначить
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500">
              {searchQuery ? (
                <p>Ассесменты по запросу "{searchQuery}" не найдены или уже назначены</p>
              ) : (
                <p>Нет доступных ассесментов для назначения</p>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="mr-2"
          >
            Отмена
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
