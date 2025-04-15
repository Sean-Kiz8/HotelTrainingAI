import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from '@/components/layout/page-header';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from "lucide-react";

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
  courses?: {
    id: number;
    courseId: number;
    order: number;
    priority: string;
    course: {
      id: number;
      title: string;
      description: string;
    }
  }[];
}

export default function LearningPaths() {
  const [isLoading, setIsLoading] = useState(true);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchLearningPaths = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/learning-paths?userId=${user.id}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setLearningPaths(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching learning paths:', error);
        toast({
          title: 'Ошибка загрузки',
          description: 'Не удалось загрузить учебные планы.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLearningPaths();
  }, [user, toast]);

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'junior':
        return 'green';
      case 'middle':
        return 'blue';
      case 'senior':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'green';
      case 'completed':
        return 'blue';
      case 'pending':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  return (
    <div className="container py-6">
      <PageHeader
        title="Учебные планы"
        subtitle="Персонализированные планы обучения, разработанные для повышения ваших профессиональных навыков"
        action={
          <Button
            onClick={() => window.location.href = '/learning-path-generator'}
          >
            Создать новый учебный план
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="mt-4 text-muted-foreground">Загрузка учебных планов...</p>
        </div>
      ) : learningPaths.length === 0 ? (
        <div className="text-center p-10 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">У вас пока нет учебных планов</h3>
          <p className="mb-6 text-muted-foreground">
            Создайте свой первый персонализированный учебный план с помощью ИИ,
            указав свою должность, уровень и желаемые навыки для развития.
          </p>
          <Button
            onClick={() => window.location.href = '/learning-path-generator'}
          >
            Создать учебный план
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-6">
          {learningPaths.map((path) => (
            <Card key={path.id}>
              <CardHeader>
                <CardTitle>{path.position}</CardTitle>
                <div className="mt-2 flex gap-2">
                  <Badge variant={getLevelColor(path.level) === 'green' ? 'success' : 'default'}>
                    {path.level}
                  </Badge>
                  <Badge variant={getStatusColor(path.status) === 'green' ? 'success' : 'default'}>
                    {path.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold">
                      Целевые навыки
                    </h4>
                    <p className="pt-2 text-sm text-muted-foreground">
                      {path.targetSkills}
                    </p>
                  </div>
                  {path.courses && (
                    <div>
                      <h4 className="text-sm font-semibold">
                        Курсы ({path.courses.length})
                      </h4>
                      <div className="space-y-2 mt-2">
                        {path.courses.slice(0, 3).map((course) => (
                          <p key={course.id} className="text-sm text-muted-foreground">
                            {course.course.title}
                          </p>
                        ))}
                        {path.courses.length > 3 && (
                          <p className="text-sm text-muted-foreground">
                            И ещё {path.courses.length - 3} курсов...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="pt-2">
                    <Button
                      className="w-full"
                      onClick={() => window.location.href = `/learning-path/${path.id}`}
                    >
                      Подробнее
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}