import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, SearchInput } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/context/auth-context";

function getAchievementIcon(type: string) {
  switch (type) {
    case "login":
      return "login";
    case "course_completion":
      return "school";
    case "lesson_completion":
      return "menu_book";
    case "quiz_score":
      return "quiz";
    case "activity":
      return "local_activity";
    case "social":
      return "people";
    default:
      return "emoji_events";
  }
}

function AchievementCard({ achievement, userAchievements = [], showProgress = true }: any) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Определяем, получено ли это достижение пользователем
  const userAchievement = userAchievements.find((ua: any) => ua.achievementId === achievement.id);
  const isUnlocked = !!userAchievement;
  
  // Определяем прогресс для достижений с требованиями по счетчику
  const progressValue = isUnlocked 
    ? 100 
    : achievement.counterTarget > 0 
      ? Math.min(100, Math.round((achievement.currentCounter || 0) / achievement.counterTarget * 100))
      : 0;
  
  const icon = getAchievementIcon(achievement.type);
  
  return (
    <>
      <Card className="h-full flex flex-col overflow-hidden">
        <div className={`h-1 ${isUnlocked ? 'bg-success' : 'bg-primary'}`}></div>
        
        <CardContent className="p-5 flex-1">
          <div className="flex justify-between items-start mb-4">
            <Badge variant={isUnlocked ? "default" : "outline"}>
              {achievement.type === "login" && "Активность"}
              {achievement.type === "course_completion" && "Курсы"}
              {achievement.type === "lesson_completion" && "Уроки"}
              {achievement.type === "quiz_score" && "Тесты"}
              {achievement.type === "activity" && "Активность"}
              {achievement.type === "social" && "Социальное"}
            </Badge>
            
            <div className={`p-1 rounded-full ${isUnlocked ? 'bg-success/10' : 'bg-muted'}`}>
              <span className={`material-icons text-base ${isUnlocked ? 'text-success' : 'text-muted-foreground'}`}>
                {isUnlocked ? "check_circle" : "lock"}
              </span>
            </div>
          </div>
          
          <div className="aspect-square bg-primary/10 rounded-lg mb-4 flex items-center justify-center">
            <span className="material-icons text-5xl text-primary">{icon}</span>
          </div>
          
          <h3 className="font-medium text-lg">{achievement.name}</h3>
          <p className="text-neutral-600 text-sm mt-1 line-clamp-2">{achievement.description}</p>
          
          {showProgress && achievement.counterTarget > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>{isUnlocked ? 'Выполнено' : `${achievement.currentCounter || 0}/${achievement.counterTarget}`}</span>
                <span>{progressValue}%</span>
              </div>
              <Progress 
                value={progressValue} 
                className={isUnlocked ? 'bg-success' : undefined}
              />
            </div>
          )}
          
          {isUnlocked && (
            <p className="text-neutral-500 text-xs mt-3">
              Получено: {new Date(userAchievement.earnedAt).toLocaleDateString('ru-RU')}
            </p>
          )}
        </CardContent>
        
        <CardFooter className="p-5 pt-0">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setDialogOpen(true)}
          >
            Подробнее
          </Button>
        </CardFooter>
      </Card>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{achievement.name}</DialogTitle>
            <DialogDescription>
              {achievement.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="p-3 bg-primary/10 rounded-full mr-3">
                <span className="material-icons text-primary">{icon}</span>
              </div>
              <div>
                <div className="font-medium">Тип достижения</div>
                <div className="text-sm text-neutral-600">
                  {achievement.type === "login" && "Активность в системе"}
                  {achievement.type === "course_completion" && "Прохождение курсов"}
                  {achievement.type === "lesson_completion" && "Изучение уроков"}
                  {achievement.type === "quiz_score" && "Прохождение тестов"}
                  {achievement.type === "activity" && "Регулярная активность"}
                  {achievement.type === "social" && "Социальная активность"}
                </div>
              </div>
            </div>
            
            {achievement.counterTarget > 0 && (
              <div className="flex items-center">
                <div className="p-3 bg-primary/10 rounded-full mr-3">
                  <span className="material-icons text-primary">trending_up</span>
                </div>
                <div>
                  <div className="font-medium">Прогресс</div>
                  <div className="text-sm text-neutral-600">
                    {isUnlocked ? 'Достижение выполнено' : `${achievement.currentCounter || 0} из ${achievement.counterTarget}`}
                  </div>
                  <Progress 
                    value={progressValue} 
                    className={`mt-2 ${isUnlocked ? 'bg-success' : undefined}`}
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center">
              <div className="p-3 bg-primary/10 rounded-full mr-3">
                <span className="material-icons text-primary">stars</span>
              </div>
              <div>
                <div className="font-medium">Награда</div>
                <div className="text-sm text-neutral-600">
                  {achievement.pointsAwarded} XP очков при выполнении
                </div>
              </div>
            </div>
            
            {isUnlocked && (
              <div className="flex items-center">
                <div className="p-3 bg-success/10 rounded-full mr-3">
                  <span className="material-icons text-success">check_circle</span>
                </div>
                <div>
                  <div className="font-medium">Статус</div>
                  <div className="text-sm text-neutral-600">
                    Получено {new Date(userAchievement.earnedAt).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-2">
            <Button 
              className="w-full"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Закрыть
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Achievements() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  
  // Получаем все достижения
  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['/api/achievements'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Получаем достижения пользователя
  const { data: userAchievements, isLoading: userAchievementsLoading } = useQuery({
    queryKey: ['/api/user-achievements', user?.id],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });
  
  const isLoading = achievementsLoading || userAchievementsLoading;
  
  // Фильтруем и сортируем достижения
  const processedAchievements = !isLoading && achievements && userAchievements
    ? achievements
        .filter((achievement: any) => 
          achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          achievement.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          achievement.type.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map((achievement: any) => {
          // Добавляем информацию о прогрессе для пользователя
          return {
            ...achievement,
            isUnlocked: userAchievements.some((ua: any) => ua.achievementId === achievement.id),
            userAchievement: userAchievements.find((ua: any) => ua.achievementId === achievement.id)
          };
        })
    : [];
  
  // Фильтруем по вкладкам
  const filteredAchievements = !isLoading && processedAchievements
    ? activeTab === "all" 
      ? processedAchievements
      : activeTab === "unlocked"
        ? processedAchievements.filter((a: any) => a.isUnlocked)
        : processedAchievements.filter((a: any) => !a.isUnlocked)
    : [];
  
  // Сортируем достижения: сначала разблокированные, затем по типу
  const sortedAchievements = !isLoading && filteredAchievements
    ? [...filteredAchievements].sort((a: any, b: any) => {
        // Сначала сортируем по статусу разблокировки
        if (a.isUnlocked !== b.isUnlocked) {
          return a.isUnlocked ? -1 : 1;
        }
        
        // Затем сортируем по типу
        if (a.type !== b.type) {
          return a.type.localeCompare(b.type);
        }
        
        // Наконец, сортируем по имени
        return a.name.localeCompare(b.name);
      })
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
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="unlocked">Полученные</TabsTrigger>
          <TabsTrigger value="locked">Не полученные</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : (
        <>
          {sortedAchievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sortedAchievements.map((achievement: any) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  userAchievements={userAchievements}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              {searchQuery ? (
                <p>Достижения по запросу "{searchQuery}" не найдены</p>
              ) : activeTab === "unlocked" ? (
                <>
                  <p>У вас пока нет полученных достижений</p>
                  <p className="text-sm mt-2">Продолжайте обучение, чтобы получить первые достижения</p>
                </>
              ) : activeTab === "locked" ? (
                <p>Все доступные достижения уже получены</p>
              ) : (
                <p>Достижения не найдены</p>
              )}
            </div>
          )}
        </>
      )}
      
      {/* Суммарная статистика */}
      {!isLoading && achievements && userAchievements && (
        <div className="mt-6">
          <h3 className="font-sans font-semibold text-lg mb-4">Статистика достижений</h3>
          <Card>
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-8">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="p-4 bg-primary bg-opacity-10 rounded-full mr-4">
                    <span className="material-icons text-primary text-2xl">emoji_events</span>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">
                      {userAchievements.length} / {achievements.length}
                    </div>
                    <p className="text-neutral-600 text-sm">достижений получено</p>
                  </div>
                </div>
                
                <div className="flex-1 mb-4 md:mb-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span>{Math.round((userAchievements.length / achievements.length) * 100)}%</span>
                    <span>Общий прогресс</span>
                  </div>
                  <Progress 
                    value={(userAchievements.length / achievements.length) * 100} 
                    className="bg-primary"
                  />
                </div>
                
                <div>
                  <div className="flex items-center">
                    <span className="material-icons text-primary text-base mr-2">stars</span>
                    <div className="text-lg font-semibold">
                      {userAchievements.reduce((total: number, ua: any) => {
                        const achievement = achievements.find((a: any) => a.id === ua.achievementId);
                        return total + (achievement?.pointsAwarded || 0);
                      }, 0)} XP
                    </div>
                  </div>
                  <p className="text-neutral-600 text-sm">получено очков</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}