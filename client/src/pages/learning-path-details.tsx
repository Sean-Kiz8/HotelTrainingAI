import { useRoute } from 'wouter';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from '@/components/layout/page-header';
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from '@/lib/queryClient';

interface Course {
  id: number;
  courseId: number;
  order: number;
  priority: string;
  completed: boolean;
  course: {
    id: number;
    title: string;
    description: string;
    image: string | null;
  }
}

interface LearningPath {
  id: number;
  userId: number;
  createdById: number;
  position: string;
  level: string;
  targetSkills: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  courses: Course[];
}

export default function LearningPathDetails() {
  const [, params] = useRoute('/learning-path/:id');

  // Загрузка данных учебного плана
  const { data: learningPath, isLoading } = useQuery<LearningPath>({
    queryKey: [`/api/learning-paths/${params?.id}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!params?.id,
  });

  // Подсчет прогресса обучения
  const calculateProgress = (): number => {
    const path = learningPath as LearningPath;
    if (!path?.courses || path.courses.length === 0) return 0;

    const completedCourses = path.courses.filter((course: Course) => course.completed).length;
    return Math.round((completedCourses / path.courses.length) * 100);
  };

  const getPriorityColor = (priority: string): "default" | "destructive" | "success" | "secondary" | "outline" => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'normal':
        return 'default';
      case 'low':
        return 'success';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-10">
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  if (!learningPath) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center p-10 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Учебный план не найден</h2>
          <p className="mb-6">
            К сожалению, запрашиваемый учебный план не существует или был удален.
          </p>
          <Button
            onClick={() => window.location.href = '/learning-paths'}
          >
            Вернуться к списку учебных планов
          </Button>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();

  const path = learningPath as LearningPath;

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title={`Учебный план: ${path.position}`}
        subtitle="Подробная информация об учебном плане и курсах"
        action={
          <Button
            onClick={() => window.location.href = '/learning-paths'}
          >
            Назад к списку
          </Button>
        }
      />

      {/* Информация о плане */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge variant="outline" className="px-2 py-1">
                {path.level}
              </Badge>
              <Badge variant={path.status === 'active' ? 'success' : 'default'} className="px-2 py-1">
                {path.status}
              </Badge>
            </div>

            <div>
              <p className="font-semibold">Целевые навыки:</p>
              <p>{path.targetSkills}</p>
            </div>

            <div>
              <p className="font-semibold">Прогресс обучения:</p>
              <Progress value={progress} className="h-2 mt-2 mb-1" />
              <p className="text-right">{progress}% выполнено</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список курсов */}
      <h3 className="text-lg font-semibold mb-4">Курсы ({path.courses.length})</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {path.courses
          .sort((a: Course, b: Course) => a.order - b.order)
          .map((coursePath: Course) => (
            <Card key={coursePath.id} className={`${coursePath.completed ? 'border-green-500 bg-green-50' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold">{coursePath.course.title}</h4>
                  <Badge variant={getPriorityColor(coursePath.priority)}>
                    {coursePath.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm mb-3 line-clamp-2">
                  {coursePath.course.description}
                </p>
                <Button
                  size="sm"
                  className="w-full"
                  variant={coursePath.completed ? 'outline' : 'default'}
                  onClick={() => window.location.href = `/course-details/${coursePath.course.id}`}
                >
                  {coursePath.completed ? 'Пройден' : 'Перейти к курсу'}
                </Button>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
