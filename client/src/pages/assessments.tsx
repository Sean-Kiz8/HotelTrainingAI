import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PageHeader, SearchInput, CreateButton } from "@/components/layout/page-header";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CreateAssessmentDialog } from "@/components/assessments/create-assessment-dialog";
import { Clock, Users, Award, FileText, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/auth-context";
import { Assessment, Role } from "@/types/assessment";
import { formatStatus, getStatusColor } from "@/utils/assessment-utils";

export default function Assessments() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [startingAssessmentId, setStartingAssessmentId] = useState<number | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { user } = useAuth();

  // Получаем список ассесментов
  const { data: assessments = [], isLoading } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments"],
    queryFn: async () => {
      let response: Response | undefined;
      let status: number | undefined;
      let data: unknown = undefined;
      let error: unknown = undefined;
      try {
        response = await fetch("/api/assessments", { credentials: 'include' });
        status = response.status;
        try {
          data = await response.json();
        } catch (e) {
          error = e;
        }
        setDebugInfo((prev: any) => ({ ...prev, assessments: { status, data, error } }));
        if (!response.ok) throw new Error(`Error: ${status}`);
        return Array.isArray(data) ? data : [];
      } catch (err) {
        setDebugInfo((prev: any) => ({ ...prev, assessments: { status, data, error, fetchError: err } }));
        throw err;
      }
    }
  });

  // Получаем список ролей для отображения названий
  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ["/api/employee-roles"],
    queryFn: async () => {
      let response: Response | undefined;
      let status: number | undefined;
      let data: unknown = undefined;
      let error: unknown = undefined;
      try {
        response = await fetch("/api/employee-roles", { credentials: 'include' });
        status = response.status;
        try {
          data = await response.json();
        } catch (e) {
          error = e;
        }
        setDebugInfo((prev: any) => ({ ...prev, roles: { status, data, error } }));
        if (!response.ok) throw new Error(`Error: ${status}`);
        return Array.isArray(data) ? data : [];
      } catch (err) {
        setDebugInfo((prev: any) => ({ ...prev, roles: { status, data, error, fetchError: err } }));
        throw err;
      }
    }
  });

  // Мемоизированная фильтрация ассесментов по поисковому запросу и статусу
  const filteredAssessments = useMemo(() =>
    assessments.filter((assessment) => {
      // Автор видит свои ассессменты в любом статусе
      if (user && assessment.createdById === user.id) {
        return (
          assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          assessment.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      // Остальные видят только ассессменты не в статусе 'created'
      if (assessment.status !== 'created') {
        return (
          assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          assessment.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return false;
    }),
    [assessments, searchQuery, user]
  );

  // Получаем название роли по ID
  const getRoleName = (roleId: number) => {
    if (!roleId) return "Не указана";
    const role = roles.find((r) => r.id === roleId);
    return role ? role.title : "Неизвестная роль";
  };

  // Получаем отдел роли по ID
  const getRoleDepartment = (roleId: number) => {
    if (!roleId) return "Не указан";
    const role = roles.find((r) => r.id === roleId);
    return role ? role.department : "Неизвестный отдел";
  };

  // Мутация для создания сессии ассесмента
  const createSessionMutation = useMutation({
    mutationFn: async (assessmentId: number) => {
      if (!user || !user.id) {
        throw new Error("Пользователь не авторизован");
      }
      const response = await apiRequest("POST", "/api/assessment-sessions", {
        assessmentId: assessmentId,
        status: "created"
      });
      return await response.json();
    },
    onSuccess: (data: { id: number }) => {
      navigate(`/assessment-session/${data.id}`);
      setStartingAssessmentId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
      setStartingAssessmentId(null);
    },
  });

  // Обработчик начала ассесмента
  const handleStartAssessment = (assessmentId: number) => {
    setStartingAssessmentId(assessmentId);
    createSessionMutation.mutate(assessmentId);
  };

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <PageHeader title="Ассесменты">
        <SearchInput
          placeholder="Поиск ассесментов..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <CreateButton
          label="Создать ассесмент"
          onClick={() => setShowCreateDialog(true)}
        />
        {/* Диалоговое окно создания ассесмента */}
        <CreateAssessmentDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </PageHeader>

      {/* Debug info */}
      {debugInfo && (
        <div className="bg-yellow-50 border border-yellow-300 rounded p-4 mb-4 text-xs text-yellow-900">
          <b>Debug info:</b>
          <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify({ user, ...debugInfo }, null, 2)}</pre>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))
        ) : (
          <>
            {filteredAssessments.length > 0 ? (
              filteredAssessments.map((assessment) => (
                <Card key={assessment.id} className="flex flex-col">
                  <CardContent className="p-6 flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-lg">{assessment.title}</h3>
                      <Badge variant={getStatusColor(assessment.status) as "default" | "destructive" | "outline" | "secondary" | "success" | null | undefined}>
                        {formatStatus(assessment.status)}
                      </Badge>
                    </div>

                    <p className="text-sm text-neutral-500 mb-4 line-clamp-2">
                      {assessment.description || "Нет описания"}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Users className="h-4 w-4 mr-2 text-neutral-500" />
                        <span>Роль: {getRoleName(assessment.roleId)}</span>
                      </div>

                      <div className="flex items-center text-sm">
                        <FileText className="h-4 w-4 mr-2 text-neutral-500" />
                        <span>Отдел: {getRoleDepartment(assessment.roleId)}</span>
                      </div>

                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-neutral-500" />
                        <span>
                          {assessment.timeLimit
                            ? `Время: ${assessment.timeLimit} мин`
                            : "Без ограничения времени"}
                        </span>
                      </div>

                      <div className="flex items-center text-sm">
                        <Award className="h-4 w-4 mr-2 text-neutral-500" />
                        <span>Проходной балл: {assessment.passingScore}%</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="px-6 py-4 border-t flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/assessment-details/${assessment.id}`)}
                    >
                      Подробнее
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleStartAssessment(assessment.id)}
                      disabled={startingAssessmentId === assessment.id}
                    >
                      {startingAssessmentId === assessment.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Подготовка...
                        </>
                      ) : (
                        "Начать ассесмент"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-neutral-500">
                <div className="mb-4 text-xs text-neutral-500">
                  <b>userId:</b> {user?.id ? user.id : 'undefined'}
                </div>
                {searchQuery ? (
                  <p>Ассесменты по запросу "{searchQuery}" не найдены</p>
                ) : (
                  <p>Нет доступных ассесментов</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
