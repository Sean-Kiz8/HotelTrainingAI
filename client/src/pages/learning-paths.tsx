import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { Link, useLocation } from "wouter";

import { PageHeader, SearchInput } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PlusCircle,
  GraduationCap,
  User,
  Briefcase,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";

// Вспомогательная функция для отображения статуса
function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge variant="success" className="ml-2">Завершен</Badge>;
    case "active":
      return <Badge variant="default" className="ml-2">Активен</Badge>;
    case "canceled":
      return <Badge variant="destructive" className="ml-2">Отменен</Badge>;
    default:
      return null;
  }
}

// Вспомогательная функция для получения иконки статуса
function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-5 w-5 text-success" />;
    case "active":
      return <Clock className="h-5 w-5 text-primary" />;
    case "canceled":
      return <AlertCircle className="h-5 w-5 text-destructive" />;
    default:
      return null;
  }
}

// Компонент карточки учебного плана
function LearningPathCard({ learningPath, onClick }: { learningPath: any, onClick: () => void }) {
  const { id, userId, position, level, targetSkills, status, progress } = learningPath;

  // Конвертируем уровень в читаемый вид
  const levelLabel = {
    junior: "Начинающий",
    middle: "Средний",
    senior: "Опытный"
  }[level] || level;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">
            План обучения {getStatusBadge(status)}
          </CardTitle>
          <div className="flex items-center">
            {getStatusIcon(status)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-4">
          <div className="flex items-center text-sm">
            <User className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>Сотрудник ID: {userId}</span>
          </div>
          <div className="flex items-center text-sm">
            <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>Должность: {position}</span>
          </div>
          <div className="flex items-center text-sm">
            <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>Уровень: {levelLabel}</span>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-medium mb-1">Целевые навыки:</div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {targetSkills}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Прогресс</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={status === "completed" ? "outline" : "default"}
          onClick={onClick}
        >
          {status === "completed" ? "Просмотреть результаты" : "Продолжить обучение"}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Компонент скелетона загрузки
function LearningPathSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center">
            <Skeleton className="h-4 w-4 mr-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex items-center">
            <Skeleton className="h-4 w-4 mr-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex items-center">
            <Skeleton className="h-4 w-4 mr-2" />
            <Skeleton className="h-4 w-1/3" />
          </div>

          <Skeleton className="h-[1px] w-full" />

          <div>
            <Skeleton className="h-4 w-1/4 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6 mt-1" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-8" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}

export default function LearningPaths() {
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("my");

  // В режиме разработки пропускаем проверку авторизации
  useEffect(() => {
    // Обновляем данные пользователя с сервера (в режиме разработки это мок-пользователь)
    refreshUser();
  }, [refreshUser]);

  // Получаем список учебных планов текущего пользователя (если он админ, то это планы, созданные им)
  const isAdmin = user?.role === "admin";
  const pathsQueryKey = isAdmin ? ["/api/learning-paths", { createdById: user?.id }] : ["/api/learning-paths", { userId: user?.id }];

  const { data: learningPaths, isLoading } = useQuery({
    queryKey: pathsQueryKey,
    // Запрос будет выполнен только если пользователь авторизован
    enabled: !!user?.id,
  });

  // Получаем список всех учебных планов
  const { data: allLearningPaths, isLoading: isLoadingAll } = useQuery({
    queryKey: ["/api/learning-paths"],
    // Убираем зависимость от авторизации в режиме разработки
    enabled: activeTab === "all",
  });

  // Фильтрация по поисковому запросу
  const filteredPaths = (activeTab === "my" ? learningPaths : allLearningPaths)?.filter((path: any) => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      path.position?.toLowerCase().includes(searchLower) ||
      path.targetSkills?.toLowerCase().includes(searchLower)
    );
  });

  // Обработчик для перехода к детальной странице
  const handlePathClick = (id: number) => {
    navigate(`/learning-paths/${id}`);
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Персональные планы обучения"
        subtitle="Просмотр и управление индивидуальными планами обучения сотрудников"
        action={
          filteredPaths?.length > 0 && (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/ai-learning-path">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    AI-генерация
                  </div>
                </Link>
              </Button>
              <Button asChild>
                <Link href="/learning-path-generator">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Создать план
                </Link>
              </Button>
            </div>
          )
        }
        headerRight={
          <SearchInput
            placeholder="Поиск по должности или навыкам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-[300px]"
          />
        }
      />

      {isAdmin && (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="mt-6"
        >
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="my" className="flex-1 sm:flex-none">Мои планы</TabsTrigger>
            <TabsTrigger value="all" className="flex-1 sm:flex-none">Все планы</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {isLoading || (isAdmin && activeTab === "all" && isLoadingAll) ? (
          // Отображение скелетонов при загрузке
          Array(6).fill(0).map((_, i) => <LearningPathSkeleton key={i} />)
        ) : filteredPaths?.length > 0 ? (
          // Отображение списка учебных планов
          filteredPaths.map((path: any) => (
            <LearningPathCard
              key={path.id}
              learningPath={path}
              onClick={() => handlePathClick(path.id)}
            />
          ))
        ) : (
          // Отображение информации, если планов нет
          <div className="col-span-full text-center p-6">
            <h3 className="text-lg font-medium mb-2">Планы обучения не найдены</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Попробуйте изменить параметры поиска"
                : isAdmin
                  ? "Нет созданных планов обучения. Создайте первый план, чтобы он появился здесь"
                  : "У вас пока нет персональных планов обучения"
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button asChild variant="outline">
                <Link href="/ai-learning-path">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    AI-генерация
                  </div>
                </Link>
              </Button>
              <Button asChild>
                <Link href="/learning-path-generator">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Создать новый план
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}