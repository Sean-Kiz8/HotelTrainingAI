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
import { CardSpotlight } from "@/components/ui/card-spotlight";

// Компонент иконки галочки
const CheckIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path
        d="M12 2c-.218 0 -.432 .002 -.642 .005l-.616 .017l-.299 .013l-.579 .034l-.553 .046c-4.785 .464 -6.732 2.411 -7.196 7.196l-.046 .553l-.034 .579c-.005 .098 -.01 .198 -.013 .299l-.017 .616l-.004 .318l-.001 .324c0 .218 .002 .432 .005 .642l.017 .616l.013 .299l.034 .579l.046 .553c.464 4.785 2.411 6.732 7.196 7.196l.553 .046l.579 .034c.098 .005 .198 .01 .299 .013l.616 .017l.642 .005l.642 -.005l.616 -.017l.299 -.013l.579 -.034l.553 -.046c4.785 -.464 6.732 -2.411 7.196 -7.196l.046 -.553l.034 -.579c.005 -.098 .01 -.198 .013 -.299l.017 -.616l.005 -.642l-.005 -.642l-.017 -.616l-.013 -.299l-.034 -.579l-.046 -.553c-.464 -4.785 -2.411 -6.732 -7.196 -7.196l-.553 -.046l-.579 -.034a28.058 28.058 0 0 0 -.299 -.013l-.616 -.017l-.318 -.004l-.324 -.001zm0 4a1 1 0 0 1 .993 .883l.007 .117v4h4a1 1 0 0 1 .117 1.993l-.117 .007h-5a1 1 0 0 1 -.993 -.883l-.007 -.117v-5a1 1 0 0 1 1 -1z"
        fill="currentColor"
        strokeWidth="0"
      />
    </svg>
  );
};

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

      {error && (
        <div className="bg-red-50 border border-red-300 rounded p-4 mb-4 text-xs text-red-900">
          <b>Ошибка:</b>
          <pre className="overflow-x-auto whitespace-pre-wrap">{String(error)}</pre>
        </div>
      )}

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
            <CardSpotlight key={path.id} className="h-full">
              <div className="relative z-10">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-2">{path.position}</h3>
                  <div className="flex gap-2">
                    <Badge variant={getLevelColor(path.level) === 'green' ? 'success' : 'default'}>
                      {path.level}
                    </Badge>
                    <Badge variant={getStatusColor(path.status) === 'green' ? 'success' : 'default'}>
                      {path.status}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      Целевые навыки
                    </h4>
                    <p className="pt-2 text-sm text-neutral-300">
                      {path.targetSkills}
                    </p>
                  </div>
                  {/* Блок курсов показываем только если есть поле courses */}
                  {Array.isArray(path.courses) && (
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        Курсы ({path.courses.length})
                      </h4>
                      <div className="space-y-2 mt-2">
                        {path.courses.slice(0, 3).map((course) => (
                          <p key={course.id} className="text-sm text-neutral-400 flex items-start gap-2">
                            <CheckIcon />
                            <span>{course.course.title}</span>
                          </p>
                        ))}
                        {path.courses.length > 3 && (
                          <p className="text-sm text-neutral-400">
                            И ещё {path.courses.length - 3} курсов...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="pt-4">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => window.location.href = `/learning-path/${path.id}`}
                    >
                      Подробнее
                    </Button>
                  </div>
                </div>
              </div>
            </CardSpotlight>
          ))}
        </div>
      )}
    </div>
  );
}