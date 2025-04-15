import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, SearchInput } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

interface CourseCardProps {
  id: number;
  title: string;
  description: string;
  department: string;
  image: string;
  progress: number;
  completed: boolean;
  onClick: () => void;
}

function CourseCard({
  id,
  title,
  description,
  department,
  image,
  progress,
  completed,
  onClick,
}: CourseCardProps) {
  // Map department to background and text color
  const getDepartmentStyles = (dept: string) => {
    switch (dept) {
      case "Обслуживание номеров":
        return { bg: "bg-primary-light", text: "text-primary" };
      case "Ресторан":
        return { bg: "bg-secondary-light", text: "text-secondary" };
      case "Адаптация":
        return { bg: "bg-accent-light", text: "text-accent" };
      default:
        return { bg: "bg-neutral-200", text: "text-neutral-700" };
    }
  };

  const { bg, text } = getDepartmentStyles(department);

  return (
    <Card className="overflow-hidden">
      <div className={`h-32 ${bg} flex items-center justify-center`}>
        <span className={`material-icons text-4xl ${text}`}>{image}</span>
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between mb-2">
          <Badge variant="outline" className={`${bg} ${text} border-0 px-2 py-1 rounded-full`}>
            {department}
          </Badge>
          <Badge variant={completed ? "success" : "outline"}>
            {completed ? "Завершено" : "В процессе"}
          </Badge>
        </div>
        <h4 className="font-sans font-medium text-lg mb-1">{title}</h4>
        <p className="text-neutral-600 text-sm mb-3">{description}</p>

        <div className="space-y-2 mb-3">
          <div className="flex justify-between text-sm">
            <span>Прогресс</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Button
          className={`w-full ${completed ? "bg-success hover:bg-success/90" : "bg-primary hover:bg-primary-dark"}`}
          onClick={onClick}
        >
          <span className="material-icons text-sm mr-1">
            {completed ? "check_circle" : "play_arrow"}
          </span>
          {completed ? "Просмотреть" : "Продолжить обучение"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function MyLearning() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch enrollments for the current user
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["/api/enrollments", user?.id],
    enabled: !!user,
  });

  // Fetch all courses
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["/api/courses"],
  });

  // Build combined data with course details and enrollment progress
  const userCourses = !enrollmentsLoading && !coursesLoading && enrollments && courses
    ? enrollments.map((enrollment: any) => {
        const course = courses.find((c: any) => c.id === enrollment.courseId);
        return {
          ...course,
          progress: enrollment.progress,
          completed: enrollment.completed,
          enrollmentId: enrollment.id,
        };
      })
    : [];

  // Filter courses by search query
  const filteredCourses = userCourses.filter((course: any) =>
    course?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course?.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Split courses by completion status
  const inProgressCourses = filteredCourses.filter((course: any) => !course.completed);
  const completedCourses = filteredCourses.filter((course: any) => course.completed);

  const isLoading = enrollmentsLoading || coursesLoading;

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <PageHeader title="Мое обучение">
        <SearchInput
          placeholder="Поиск курсов..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </PageHeader>

      <Tabs defaultValue="in-progress" className="mb-6">
        <TabsList>
          <TabsTrigger value="in-progress">В процессе</TabsTrigger>
          <TabsTrigger value="completed">Завершенные</TabsTrigger>
          <TabsTrigger value="available">Доступные курсы</TabsTrigger>
        </TabsList>

        <TabsContent value="in-progress" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          ) : (
            <>
              {inProgressCourses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inProgressCourses.map((course: any) => (
                    <CourseCard
                      key={course.id}
                      id={course.id}
                      title={course.title}
                      description={course.description}
                      department={course.department}
                      image={course.image}
                      progress={course.progress}
                      completed={course.completed}
                      onClick={() => toast({
                        title: "Переход к курсу",
                        description: `Открыт курс: ${course.title}`,
                      })}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  {searchQuery ? (
                    <p>Курсы по запросу "{searchQuery}" не найдены</p>
                  ) : (
                    <p>У вас нет незавершенных курсов</p>
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          ) : (
            <>
              {completedCourses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedCourses.map((course: any) => (
                    <CourseCard
                      key={course.id}
                      id={course.id}
                      title={course.title}
                      description={course.description}
                      department={course.department}
                      image={course.image}
                      progress={course.progress}
                      completed={course.completed}
                      onClick={() => toast({
                        title: "Просмотр курса",
                        description: `Открыт курс: ${course.title}`,
                      })}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  {searchQuery ? (
                    <p>Курсы по запросу "{searchQuery}" не найдены</p>
                  ) : (
                    <p>У вас нет завершенных курсов</p>
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="available" className="mt-4">
          <div className="text-center py-12 text-neutral-500">
            <p>Изучите доступные для вас курсы</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => toast({
                title: "Каталог курсов",
                description: "Функциональность находится в разработке",
              })}
            >
              <span className="material-icons text-sm mr-1">menu_book</span>
              Перейти к каталогу курсов
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Summary Section */}
      <div className="mt-6">
        <h3 className="font-sans font-semibold text-lg mb-4">Сводка обучения</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center">
              <span className="material-icons text-primary text-3xl mr-3">school</span>
              <div>
                <p className="text-sm text-neutral-600">Всего курсов</p>
                <p className="text-2xl font-bold">{userCourses.length || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center">
              <span className="material-icons text-success text-3xl mr-3">check_circle</span>
              <div>
                <p className="text-sm text-neutral-600">Завершено</p>
                <p className="text-2xl font-bold">{completedCourses.length || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center">
              <span className="material-icons text-warning text-3xl mr-3">timeline</span>
              <div>
                <p className="text-sm text-neutral-600">Средний прогресс</p>
                <p className="text-2xl font-bold">
                  {userCourses.length 
                    ? Math.round(userCourses.reduce((acc: number, course: any) => acc + course.progress, 0) / userCourses.length) 
                    : 0}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
