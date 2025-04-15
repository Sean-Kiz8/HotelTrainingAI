import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { PageHeader, PageHeaderHeading } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseCard } from "@/components/dashboard/course-card";
import { AssignAssessmentDialog } from "@/components/employees/assign-assessment-dialog";

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  // Не используем toast, так как нет уведомлений
  // Не используем queryClient, так как нет мутаций
  const userId = parseInt(id);
  const [showAssignAssessmentDialog, setShowAssignAssessmentDialog] = useState(false);

  // Определяем интерфейс для данных сотрудника
  interface Employee {
    id: number;
    name: string;
    avatar?: string;
    position?: string;
    department?: string;
    email?: string;
    username?: string;
    roleId?: number;
  }

  // Получаем данные сотрудника
  const { data: employee, isLoading: isLoadingEmployee } = useQuery<Employee>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId && !isNaN(userId),
  });

  // Получаем записи на курсы для сотрудника
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery<any[]>({
    queryKey: [`/api/enrollments?userId=${userId}`],
    enabled: !!userId && !isNaN(userId),
  });

  // Получаем все курсы
  const { data: allCourses = [], isLoading: isLoadingCourses } = useQuery<any[]>({
    queryKey: ["/api/courses"],
  });

  // Получаем уровень пользователя
  const { data: userLevel, isLoading: isLoadingUserLevel } = useQuery<{ level: number, points: number }>({
    queryKey: [`/api/user-level/${userId}`],
    enabled: !!userId && !isNaN(userId),
  });

  // Получаем достижения пользователя
  const { data: userAchievements = [], isLoading: isLoadingAchievements } = useQuery<any[]>({
    queryKey: [`/api/user-achievements/${userId}`],
    enabled: !!userId && !isNaN(userId),
  });

  // Получаем сессии ассесментов для сотрудника
  const { data: assessmentSessions = [], isLoading: isLoadingAssessmentSessions } = useQuery<any[]>({
    queryKey: [`/api/assessment-sessions?userId=${userId}`],
    enabled: !!userId && !isNaN(userId),
  });

  // Разделяем курсы на завершенные и в процессе
  const inProgressCourses = enrollments
    .filter((enrollment: any) => !enrollment.completed)
    .map((enrollment: any) => {
      const course = allCourses.find((c: any) => c.id === enrollment.courseId);
      return course ? {
        ...course,
        progress: enrollment.progress,
        completed: enrollment.completed,
        enrollmentId: enrollment.id
      } : null;
    })
    .filter(Boolean);

  const completedCourses = enrollments
    .filter((enrollment: any) => enrollment.completed)
    .map((enrollment: any) => {
      const course = allCourses.find((c: any) => c.id === enrollment.courseId);
      return course ? {
        ...course,
        progress: enrollment.progress,
        completed: enrollment.completed,
        enrollmentId: enrollment.id
      } : null;
    })
    .filter(Boolean);

  // Вычисляем общий прогресс обучения
  const totalProgress = enrollments.length > 0
    ? Math.round(
        enrollments.reduce((sum: number, enrollment: any) => sum + enrollment.progress, 0) /
        enrollments.length
      )
    : 0;

  if (isLoadingEmployee) {
    return (
      <div className="p-4 md:p-6 pb-24 md:pb-6">
        <PageHeader className="mb-6">
          <PageHeaderHeading>Профиль сотрудника</PageHeaderHeading>
        </PageHeader>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-4 md:p-6 pb-24 md:pb-6">
        <PageHeader className="mb-6">
          <PageHeaderHeading>Профиль сотрудника</PageHeaderHeading>
        </PageHeader>
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-medium mb-2">Сотрудник не найден</h2>
            <p className="text-neutral-500 mb-4">Сотрудник с указанным ID не существует или был удален</p>
            <Button onClick={() => navigate('/employees')}>
              Вернуться к списку сотрудников
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Определяем типизированные данные сотрудника
  const employeeName = employee?.name || "Сотрудник";
  const employeeAvatar = employee?.avatar || "";
  const employeePosition = employee?.position || "Должность не указана";
  const employeeDepartment = employee?.department || "";
  const employeeEmail = employee?.email || "";
  const employeeUsername = employee?.username || "";

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <PageHeader>
        <PageHeaderHeading className="mb-6">Профиль сотрудника</PageHeaderHeading>
        <Button
          variant="outline"
          onClick={() => setShowAssignAssessmentDialog(true)}
          className="ml-auto"
        >
          Назначить ассесмент
        </Button>

        {/* Диалоговое окно назначения ассесмента */}
        <AssignAssessmentDialog
          open={showAssignAssessmentDialog}
          onOpenChange={setShowAssignAssessmentDialog}
          employeeId={userId}
          employeeName={employeeName}
        />
      </PageHeader>

      {/* Карточка профиля */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={employeeAvatar} alt={employeeName} />
              <AvatarFallback className="text-2xl">{employeeName.charAt(0)}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-medium">{employeeName}</h2>
                  <p className="text-neutral-500">{employeePosition}</p>
                  {employeeDepartment && (
                    <Badge variant="outline" className="mt-1">
                      {employeeDepartment}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col items-start md:items-end">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-neutral-500">Email:</span>
                    <span>{employeeEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-500">Логин:</span>
                    <span>{employeeUsername}</span>
                  </div>
                </div>
              </div>

              {/* Прогресс обучения */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-neutral-500">Общий прогресс обучения</span>
                  <span className="text-sm font-medium">{totalProgress}%</span>
                </div>
                <Progress value={totalProgress} className="h-2" />
              </div>

              {/* Уровень и достижения */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-md">
                  <span className="material-icons text-primary">military_tech</span>
                  <div>
                    <div className="font-medium">Уровень {isLoadingUserLevel ? '...' : userLevel?.level || 1}</div>
                    <div className="text-xs text-neutral-500">
                      {isLoadingUserLevel ? 'Загрузка...' : `${userLevel?.points || 0} XP`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-md">
                  <span className="material-icons text-primary">emoji_events</span>
                  <div>
                    <div className="font-medium">Достижения</div>
                    <div className="text-xs text-neutral-500">
                      {isLoadingAchievements ? 'Загрузка...' : `${userAchievements.length} получено`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Вкладки с курсами и ассесментами */}
      <Tabs defaultValue="in-progress" className="mb-6">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="in-progress">В процессе обучения</TabsTrigger>
          <TabsTrigger value="completed">Завершенные курсы</TabsTrigger>
          <TabsTrigger value="assessments">Ассесменты</TabsTrigger>
        </TabsList>

        <TabsContent value="in-progress" className="mt-4">
          {isLoadingEnrollments || isLoadingCourses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : (
            <>
              {inProgressCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inProgressCourses.map((course: any) => (
                    <CourseCard
                      key={course.id}
                      id={course.id}
                      title={course.title}
                      description={course.description}
                      department={course.department}
                      participantCount={course.participantCount || 0}
                      image={course.image}
                      rating={course.rating || 0}
                      ratingCount={course.ratingCount || 0}
                      completionRate={course.progress}
                      onClick={() => navigate(`/course-details/${course.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  <p>Нет курсов в процессе обучения</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate('/courses')}
                  >
                    Просмотреть доступные курсы
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {isLoadingEnrollments || isLoadingCourses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : (
            <>
              {completedCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedCourses.map((course: any) => (
                    <CourseCard
                      key={course.id}
                      id={course.id}
                      title={course.title}
                      description={course.description}
                      department={course.department}
                      participantCount={course.participantCount || 0}
                      image={course.image}
                      rating={course.rating || 0}
                      ratingCount={course.ratingCount || 0}
                      completionRate={100}
                      onClick={() => navigate(`/course-details/${course.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  <p>Нет завершенных курсов</p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="assessments" className="mt-4">
          {isLoadingAssessmentSessions ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <>
              {assessmentSessions.length > 0 ? (
                <div className="space-y-4">
                  {assessmentSessions.map((session: any) => (
                    <Card key={session.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{session.assessment?.title || 'Ассесмент'}</h3>
                            <p className="text-sm text-neutral-500 mt-1">
                              {session.status === 'completed'
                                ? `Завершен: ${new Date(session.completedAt).toLocaleDateString()}`
                                : session.status === 'in_progress'
                                  ? 'В процессе'
                                  : 'Не начат'}
                            </p>
                            {session.status === 'completed' && (
                              <div className="mt-2">
                                <Badge variant={session.score_percentage >= 70 ? 'success' : 'destructive'}>
                                  Результат: {session.score_percentage}%
                                </Badge>
                                {session.level && (
                                  <Badge variant="outline" className="ml-2">
                                    Уровень: {session.level}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant={session.status === 'completed' ? 'outline' : 'default'}
                            onClick={() => navigate(`/assessment-session/${session.id}`)}
                          >
                            {session.status === 'completed' ? 'Просмотр результатов' : 'Пройти ассесмент'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  <p>Нет назначенных ассесментов</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowAssignAssessmentDialog(true)}
                  >
                    Назначить ассесмент
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button
          variant="outline"
          className="mr-2"
          onClick={() => navigate('/employees')}
        >
          Назад к списку сотрудников
        </Button>
        <Button
          onClick={() => navigate(`/learning-path-generator?userId=${userId}`)}
        >
          Создать учебный план
        </Button>
      </div>
    </div>
  );
}
