import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, SearchInput } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/context/auth-context";

function getProgressColor(level: number) {
  if (level < 3) return "bg-primary";
  if (level < 5) return "bg-info";
  if (level < 8) return "bg-warning";
  return "bg-success";
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

function getBadgeByLevel(level: number) {
  if (level < 3) return { text: "Начинающий", class: "bg-primary-light text-primary" };
  if (level < 5) return { text: "Продвинутый", class: "bg-info-light text-info" };
  if (level < 8) return { text: "Опытный", class: "bg-warning-light text-warning" };
  return { text: "Эксперт", class: "bg-success-light text-success" };
}

function LeaderboardRow({ 
  position, 
  name, 
  avatar, 
  department, 
  level, 
  points, 
  nextLevelPoints, 
  isCurrentUser 
}: { 
  position: number; 
  name: string; 
  avatar?: string; 
  department?: string; 
  level: number; 
  points: number; 
  nextLevelPoints: number; 
  isCurrentUser: boolean;
}) {
  const badge = getBadgeByLevel(level);
  const progress = Math.floor((points / nextLevelPoints) * 100);
  
  return (
    <Card className={`mb-3 ${isCurrentUser ? 'border-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 w-8 text-center font-medium text-neutral-600">
            {position}
          </div>
          
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <h3 className="text-base font-medium truncate">
                {name} {isCurrentUser && <span className="text-xs text-neutral-500">(вы)</span>}
              </h3>
              <Badge className={`ml-2 ${badge.class}`}>{badge.text}</Badge>
            </div>
            <div className="text-sm text-neutral-500 truncate">
              {department || 'Отдел не указан'}
            </div>
          </div>
          
          <div className="text-center mr-3">
            <div className="text-lg font-semibold">{level}</div>
            <div className="text-xs text-neutral-500">Уровень</div>
          </div>
          
          <div className="w-28 md:w-40">
            <div className="flex justify-between text-xs mb-1">
              <span>{points}</span>
              <span>{nextLevelPoints}</span>
            </div>
            <Progress value={progress} className={getProgressColor(level)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DepartmentFilter({ departments, selectedDepartment, onChange }: any) {
  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
      <Badge 
        variant={selectedDepartment === 'all' ? 'default' : 'outline'} 
        className="cursor-pointer"
        onClick={() => onChange('all')}
      >
        Все отделы
      </Badge>
      {departments.map((department: string) => (
        <Badge 
          key={department}
          variant={selectedDepartment === department ? 'default' : 'outline'} 
          className="cursor-pointer"
          onClick={() => onChange(department)}
        >
          {department}
        </Badge>
      ))}
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all_time');
  
  // Fetch leaderboard data
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['/api/leaderboard'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Fetch users data for names and avatars
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  const isDataLoading = isLoading || usersLoading;
  
  // Combine user level data with user info
  const leaderboardWithUsers = !isDataLoading && leaderboard && users
    ? leaderboard.map((item: any) => {
        const userInfo = users.find((u: any) => u.id === item.userId);
        return {
          ...item,
          name: userInfo?.name || `Пользователь ${item.userId}`,
          avatar: userInfo?.avatar,
          department: userInfo?.department,
        };
      })
      // Filter by search query
      .filter((item: any) => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.department && item.department.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      // Filter by selected department
      .filter((item: any) => 
        selectedDepartment === 'all' || item.department === selectedDepartment
      )
    : [];
  
  // Extract unique departments for filter
  const departments = !isDataLoading && users
    ? Array.from(new Set(users.map((u: any) => u.department).filter(Boolean)))
    : [];
  
  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <PageHeader title="Рейтинг">
        <SearchInput
          placeholder="Поиск по имени или отделу..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </PageHeader>
      
      <Tabs defaultValue="all_time" className="mb-6" onValueChange={setSelectedPeriod}>
        <TabsList>
          <TabsTrigger value="all_time">За все время</TabsTrigger>
          <TabsTrigger value="month">За месяц</TabsTrigger>
          <TabsTrigger value="week">За неделю</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all_time" className="mt-4">
          <DepartmentFilter 
            departments={departments}
            selectedDepartment={selectedDepartment}
            onChange={setSelectedDepartment}
          />
          
          {isDataLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <>
              {leaderboardWithUsers.length > 0 ? (
                <div>
                  {leaderboardWithUsers
                    .sort((a: any, b: any) => {
                      // Sort by level desc, then by points desc
                      if (b.level !== a.level) return b.level - a.level;
                      return b.points - a.points;
                    })
                    .map((item: any, index: number) => (
                      <LeaderboardRow
                        key={item.userId}
                        position={index + 1}
                        name={item.name}
                        avatar={item.avatar}
                        department={item.department}
                        level={item.level}
                        points={item.points}
                        nextLevelPoints={item.nextLevelPoints}
                        isCurrentUser={item.userId === user?.id}
                      />
                    ))}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  {searchQuery || selectedDepartment !== 'all' ? (
                    <p>Нет данных для текущего фильтра</p>
                  ) : (
                    <p>Рейтинг пока пуст. Скоро здесь появятся первые результаты.</p>
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="month" className="mt-4">
          <DepartmentFilter 
            departments={departments}
            selectedDepartment={selectedDepartment}
            onChange={setSelectedDepartment}
          />
          
          <div className="text-center py-12 text-neutral-500">
            <p>Статистика за месяц будет доступна после первого месяца использования</p>
          </div>
        </TabsContent>
        
        <TabsContent value="week" className="mt-4">
          <DepartmentFilter 
            departments={departments}
            selectedDepartment={selectedDepartment}
            onChange={setSelectedDepartment}
          />
          
          <div className="text-center py-12 text-neutral-500">
            <p>Статистика за неделю будет доступна после первой недели использования</p>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Stats cards */}
      <div className="mt-6">
        <h3 className="font-sans font-semibold text-lg mb-4">Ваша статистика</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center">
              <span className="material-icons text-primary text-3xl mr-3">trending_up</span>
              <div>
                <p className="text-sm text-neutral-500">Ваш уровень</p>
                <p className="text-2xl font-semibold">
                  {!isDataLoading && leaderboardWithUsers.length > 0
                    ? leaderboardWithUsers.find((item: any) => item.userId === user?.id)?.level || 1
                    : 1}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-5 flex items-center">
              <span className="material-icons text-warning text-3xl mr-3">emoji_events</span>
              <div>
                <p className="text-sm text-neutral-500">Позиция в рейтинге</p>
                <p className="text-2xl font-semibold">
                  {!isDataLoading && leaderboardWithUsers.length > 0
                    ? leaderboardWithUsers.findIndex((item: any) => item.userId === user?.id) + 1 || '-'
                    : '-'}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-5 flex items-center">
              <span className="material-icons text-success text-3xl mr-3">whatshot</span>
              <div>
                <p className="text-sm text-neutral-500">Очки опыта</p>
                <p className="text-2xl font-semibold">
                  {!isDataLoading && leaderboardWithUsers.length > 0
                    ? leaderboardWithUsers.find((item: any) => item.userId === user?.id)?.points || 0
                    : 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}