import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from '@/components/layout/page-header';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from "lucide-react";
import { LearningPath } from '@/types/learning-path';
import { getLevelColor, getStatusColor } from '@/utils/learning-path-utils';

export default function LearningPaths() {
  const [isLoading, setIsLoading] = useState(true);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchLearningPaths = async () => {
      if (!user?.id) {
        setDebugInfo({ error: 'user.id is undefined', user });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const url = `/api/learning-paths?userId=${user.id}`;
        const response = await fetch(url, {
          credentials: 'include'
        });
        const status = response.status;
        let data = null;
        let error = null;
        try {
          data = await response.json();
        } catch (e) {
          error = e;
        }
        setDebugInfo({ userId: user.id, url, status, data, error });
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        setLearningPaths(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching learning paths:', error);
        setError(error);
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
  }, [user?.id]);

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

      {/* Debug info */}
      {debugInfo && (
        <div className="bg-yellow-50 border border-yellow-300 rounded p-4 mb-4 text-xs text-yellow-900">
          <b>Debug info:</b>
          <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
          <b>learningPaths:</b>
          <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify(learningPaths, null, 2)}</pre>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-300 rounded p-4 mb-4 text-xs text-red-900">
          <b>Ошибка:</b>
          <pre className="overflow-x-auto whitespace-pre-wrap">{String(error)}</pre>
        </div>
      )}
      {/* Временный вывод всех учебных планов для диагностики */}
      <div className="bg-blue-50 border border-blue-300 rounded p-4 mb-4 text-xs text-blue-900">
        <b>All learningPaths (raw):</b>
        <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify(learningPaths, null, 2)}</pre>
      </div>

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
          <div className="mb-4 text-xs text-neutral-500">
            <b>userId:</b> {user?.id ? user.id : 'undefined'}
          </div>
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
                  {/* Блок курсов показываем только если есть поле courses */}
                  {Array.isArray(path.courses) && (
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