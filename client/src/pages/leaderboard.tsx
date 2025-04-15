import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, SearchInput } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getQueryFn } from "@/lib/queryClient";

// Определение цвета прогресса в зависимости от уровня
function getProgressColor(level: number) {
  if (level < 3) return "bg-primary"; // Начальный уровень - голубой
  if (level < 5) return "bg-green-500"; // Средний уровень - зеленый
  if (level < 8) return "bg-purple-500"; // Продвинутый уровень - фиолетовый
  return "bg-yellow-500"; // Экспертный уровень - золотой
}

// Получение инициалов из имени
function getInitials(name: string): string {
  if (!name) return "";
  
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

// Определение значка уровня
function getBadgeByLevel(level: number) {
  if (level < 3) return { icon: "school", label: "Новичок" };
  if (level < 5) return { icon: "psychology", label: "Специалист" };
  if (level < 8) return { icon: "star", label: "Профессионал" };
  return { icon: "workspace_premium", label: "Эксперт" };
}

// Компонент строки лидерборда
function LeaderboardRow({ 
  position, 
  userLevel, 
  user, 
  showDetails = false 
}: { 
  position: number;
  userLevel: any;
  user: any;
  showDetails?: boolean;
}) {
  const progressColor = getProgressColor(userLevel.level);
  const badge = getBadgeByLevel(userLevel.level);
  
  // Вычисляем прогресс для текущего уровня (в процентах)
  const progress = Math.floor((userLevel.points / userLevel.nextLevelPoints) * 100);
  
  // Показываем детальную информацию в соответствии с переданным параметром
  return (
    <Card className={`mb-2 overflow-hidden ${position <= 3 ? 'border-primary border-2' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center">
          {/* Позиция в рейтинге */}
          <div className="w-10 flex justify-center font-bold text-xl">
            {position <= 3 ? (
              <span className="material-icons text-2xl text-yellow-500">
                {position === 1 && "emoji_events"}
                {position === 2 && "workspace_premium"}
                {position === 3 && "military_tech"}
              </span>
            ) : (
              <span>{position}</span>
            )}
          </div>
          
          {/* Аватар пользователя */}
          <Avatar className="h-12 w-12 mr-4">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(user?.name || "")}
            </AvatarFallback>
          </Avatar>
          
          {/* Информация о пользователе */}
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{user?.name || "Пользователь"}</h3>
                <div className="text-sm text-neutral-500 flex items-center">
                  <span>{user?.department || "Отдел не указан"}</span>
                  {user?.role && (
                    <>
                      <span className="mx-1">•</span>
                      <span>{user.role}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center">
                <Badge variant="outline" className="flex items-center gap-1 mr-2">
                  <span className="material-icons text-sm">{badge.icon}</span>
                  <span>{badge.label}</span>
                </Badge>
                <div className="font-semibold text-right">
                  <div className="text-lg">{userLevel.points} XP</div>
                  <div className="text-xs text-neutral-500">Уровень {userLevel.level}</div>
                </div>
              </div>
            </div>
            
            {/* Прогресс-бар текущего уровня */}
            {showDetails && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>{progress}%</span>
                  <span>до уровня {userLevel.level + 1}</span>
                </div>
                <Progress value={progress} className={progressColor} />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Компонент фильтра по отделам
function DepartmentFilter({ departments, selectedDepartment, onChange }: any) {
  return (
    <div className="w-full md:w-64">
      <Select 
        value={selectedDepartment} 
        onValueChange={onChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Выберите отдел" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все отделы</SelectItem>
          {departments.map((dept: string, index: number) => (
            <SelectItem key={index} value={dept}>{dept}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function Leaderboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [departments, setDepartments] = useState<string[]>([]);
  
  // Получаем данные пользователей
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Получаем данные лидерборда
  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['/api/leaderboard'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Извлекаем уникальные отделы из данных пользователей
  useEffect(() => {
    if (users && Array.isArray(users)) {
      const depts = users
        .map(user => user.department)
        .filter((dept): dept is string => !!dept) // Отфильтровываем undefined и null
        .filter((dept, index, self) => self.indexOf(dept) === index) // Уникальные значения
        .sort();
      
      setDepartments(depts);
    }
  }, [users]);
  
  const isLoading = usersLoading || leaderboardLoading;
  
  // Объединяем данные пользователей с данными уровней для отображения
  const leaderboardWithUserData = !isLoading && leaderboard && users
    ? leaderboard
        .map((userLevel: any) => ({
          ...userLevel,
          user: users.find((user: any) => user.id === userLevel.userId) || null
        }))
        .filter((item: any) => {
          // Фильтрация по поисковому запросу (имя или отдел)
          const matchesSearch = searchQuery === "" || 
            (item.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             item.user?.department?.toLowerCase().includes(searchQuery.toLowerCase()));
          
          // Фильтрация по выбранному отделу
          const matchesDepartment = selectedDepartment === "all" || 
            item.user?.department === selectedDepartment;
          
          return matchesSearch && matchesDepartment;
        })
    : [];
  
  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <PageHeader title="Таблица лидеров">
        <SearchInput
          placeholder="Поиск по имени..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </PageHeader>
      
      <div className="mb-4">
        <DepartmentFilter 
          departments={departments} 
          selectedDepartment={selectedDepartment} 
          onChange={setSelectedDepartment} 
        />
      </div>
      
      {isLoading ? (
        // Загрузочное состояние
        <div>
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} className="h-24 mb-2" />
          ))}
        </div>
      ) : (
        // Отображение данных
        <div>
          {leaderboardWithUserData.length > 0 ? (
            leaderboardWithUserData.map((item: any, index: number) => (
              <LeaderboardRow 
                key={item.userId} 
                position={index + 1} 
                userLevel={item} 
                user={item.user} 
                showDetails={index < 10} // Показываем детали только для топ-10
              />
            ))
          ) : (
            <div className="text-center py-12 text-neutral-500">
              {searchQuery || selectedDepartment !== "all" ? (
                <p>Пользователи не найдены по заданным критериям</p>
              ) : (
                <p>В таблице лидеров пока нет пользователей</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}