import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, SearchInput } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

interface AchievementCardProps {
  title: string;
  description: string;
  date: string;
  icon: string;
  iconColor: string;
  badgeText?: string;
  badgeVariant?: "default" | "secondary" | "outline";
  onClick?: () => void;
}

function AchievementCard({
  title,
  description,
  date,
  icon,
  iconColor,
  badgeText,
  badgeVariant = "default",
  onClick,
}: AchievementCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-0">
        <div className="p-5 flex items-start">
          <div className={`h-12 w-12 rounded-full ${iconColor} bg-opacity-20 flex items-center justify-center mr-4`}>
            <span className={`material-icons ${iconColor}`}>{icon}</span>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-lg">{title}</h3>
              {badgeText && (
                <Badge variant={badgeVariant}>{badgeText}</Badge>
              )}
            </div>
            <p className="text-neutral-600 text-sm mt-1">{description}</p>
            <div className="flex justify-between items-center mt-3">
              <span className="text-neutral-500 text-xs">{date}</span>
              {onClick && (
                <Button variant="link" size="sm" className="text-primary p-0 h-auto" onClick={onClick}>
                  Подробнее
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CertificateCardProps {
  title: string;
  issueDate: string;
  department: string;
  onClick: () => void;
}

function CertificateCard({
  title,
  issueDate,
  department,
  onClick,
}: CertificateCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <span className="material-icons text-primary text-3xl">workspace_premium</span>
          <Badge variant="outline">{department}</Badge>
        </div>
        <h3 className="font-medium text-lg mb-2">{title}</h3>
        <div className="flex justify-between items-center">
          <span className="text-neutral-500 text-sm">Выдан: {issueDate}</span>
          <Button variant="outline" size="sm" onClick={onClick}>
            <span className="material-icons text-sm mr-1">download</span>
            Скачать
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Achievements() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch user enrollments with completed courses
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["/api/enrollments", user?.id],
    enabled: !!user,
  });

  // Fetch courses to get details for completed courses
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["/api/courses"],
  });

  const isLoading = enrollmentsLoading || coursesLoading;

  // Filter completed courses for certificates
  const completedCourses = !isLoading && enrollments && courses
    ? enrollments
        .filter((enrollment: any) => enrollment.completed)
        .map((enrollment: any) => {
          const course = courses.find((c: any) => c.id === enrollment.courseId);
          return {
            ...course,
            completionDate: enrollment.completionDate,
          };
        })
        .filter((course: any) => 
          course?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course?.department?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    : [];

  // Mock achievements (based on completed courses)
  const achievements = !isLoading && completedCourses
    ? [
        ...completedCourses.map((course: any) => ({
          id: `course-${course.id}`,
          title: `Завершение курса: ${course.title}`,
          description: `Вы успешно завершили курс "${course.title}" и получили сертификат`,
          date: new Date(course.completionDate).toLocaleDateString('ru-RU'),
          icon: "school",
          iconColor: "text-success",
          badgeText: "Сертификат",
          badgeVariant: "default",
          type: "course_completion",
        })),
        // Add department progress achievements if there are completed courses for a department
        ...Array.from(new Set(completedCourses.map((c: any) => c.department)))
          .map(department => {
            const departmentCourses = completedCourses.filter((c: any) => c.department === department);
            
            // Only create department achievements if there are at least 2 completed courses
            if (departmentCourses.length >= 2) {
              return {
                id: `dept-${department}`,
                title: `Специалист отдела "${department}"`,
                description: `Вы успешно завершили ${departmentCourses.length} курсов по направлению "${department}"`,
                date: new Date(Math.max(...departmentCourses.map((c: any) => new Date(c.completionDate).getTime()))).toLocaleDateString('ru-RU'),
                icon: "workspace_premium",
                iconColor: "text-accent",
                badgeText: "Достижение",
                badgeVariant: "secondary",
                type: "department_progress",
              };
            }
            return null;
          })
          .filter(a => a !== null)
      ]
    : [];

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <PageHeader title="Достижения">
        <SearchInput
          placeholder="Поиск достижений..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </PageHeader>

      <Tabs defaultValue="achievements" className="mb-6">
        <TabsList>
          <TabsTrigger value="achievements">Достижения</TabsTrigger>
          <TabsTrigger value="certificates">Сертификаты</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : (
            <>
              {achievements.length > 0 ? (
                <div className="space-y-4">
                  {achievements.map((achievement: any) => (
                    <AchievementCard
                      key={achievement.id}
                      title={achievement.title}
                      description={achievement.description}
                      date={achievement.date}
                      icon={achievement.icon}
                      iconColor={achievement.iconColor}
                      badgeText={achievement.badgeText}
                      badgeVariant={achievement.badgeVariant}
                      onClick={() => toast({
                        title: "Подробности достижения",
                        description: achievement.title,
                      })}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  {searchQuery ? (
                    <p>Достижения по запросу "{searchQuery}" не найдены</p>
                  ) : (
                    <>
                      <p>У вас пока нет достижений</p>
                      <p className="text-sm mt-2">Завершите курсы, чтобы получить достижения и сертификаты</p>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="certificates" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : (
            <>
              {completedCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedCourses.map((course: any) => (
                    <CertificateCard
                      key={course.id}
                      title={`Сертификат: ${course.title}`}
                      issueDate={new Date(course.completionDate).toLocaleDateString('ru-RU')}
                      department={course.department}
                      onClick={() => toast({
                        title: "Скачивание сертификата",
                        description: `Сертификат по курсу "${course.title}" будет скачан`,
                      })}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  {searchQuery ? (
                    <p>Сертификаты по запросу "{searchQuery}" не найдены</p>
                  ) : (
                    <>
                      <p>У вас пока нет сертификатов</p>
                      <p className="text-sm mt-2">Завершите курсы, чтобы получить сертификаты</p>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Summary cards */}
      <div className="mt-6">
        <h3 className="font-sans font-semibold text-lg mb-4">Сводка достижений</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center">
              <span className="material-icons text-primary text-3xl mr-3">workspace_premium</span>
              <div>
                <p className="text-sm text-neutral-600">Достижения</p>
                <p className="text-2xl font-bold">{achievements?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center">
              <span className="material-icons text-success text-3xl mr-3">school</span>
              <div>
                <p className="text-sm text-neutral-600">Сертификаты</p>
                <p className="text-2xl font-bold">{completedCourses?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center">
              <span className="material-icons text-accent text-3xl mr-3">trending_up</span>
              <div>
                <p className="text-sm text-neutral-600">Следующее достижение</p>
                <p className="text-sm font-medium">
                  {achievements?.length > 0 
                    ? "Командная работа" 
                    : "Первое завершение курса"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
