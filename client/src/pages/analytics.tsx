import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// Типы данных для аналитики
interface DepartmentStats {
  name: string;
  completionRate: number;
  enrollmentCount: number;
  color: string;
}

interface CourseCompletionData {
  courseName: string;
  completed: number;
  inProgress: number;
  notStarted: number;
}

interface EmployeeProgressData {
  month: string;
  completedCourses: number;
  averageScore: number;
}

interface EmployeeActivity {
  name: string;
  department: string;
  completedCourses: number;
  averageScore: number;
  lastActivityDate: string;
}

// Моковые данные для демонстрации
const departmentData: DepartmentStats[] = [
  { name: "Обслуживание номеров", completionRate: 68, enrollmentCount: 42, color: "#4f46e5" },
  { name: "Ресторан", completionRate: 75, enrollmentCount: 35, color: "#8b5cf6" },
  { name: "Адаптация", completionRate: 92, enrollmentCount: 58, color: "#06b6d4" },
  { name: "Работа с гостями", completionRate: 63, enrollmentCount: 40, color: "#2dd4bf" },
  { name: "Безопасность", completionRate: 85, enrollmentCount: 65, color: "#f43f5e" },
  { name: "Мероприятия", completionRate: 52, enrollmentCount: 28, color: "#f59e0b" },
];

const monthlyCourseCompletionData = [
  { month: "Янв", completions: 12 },
  { month: "Фев", completions: 15 },
  { month: "Мар", completions: 18 },
  { month: "Апр", completions: 14 },
  { month: "Май", completions: 22 },
  { month: "Июн", completions: 26 },
  { month: "Июл", completions: 28 },
  { month: "Авг", completions: 25 },
  { month: "Сен", completions: 30 },
  { month: "Окт", completions: 24 },
  { month: "Ноя", completions: 20 },
  { month: "Дек", completions: 15 },
];

const courseCompletionData: CourseCompletionData[] = [
  { courseName: "Стандарты обслуживания номеров", completed: 25, inProgress: 12, notStarted: 8 },
  { courseName: "Ресторанный сервис", completed: 22, inProgress: 8, notStarted: 5 },
  { courseName: "Базовый курс для новых сотрудников", completed: 45, inProgress: 10, notStarted: 3 },
  { courseName: "Управление конфликтами с гостями", completed: 18, inProgress: 15, notStarted: 12 },
  { courseName: "Пожарная безопасность", completed: 50, inProgress: 10, notStarted: 5 },
];

const employeeProgressData: EmployeeProgressData[] = [
  { month: "Янв", completedCourses: 5, averageScore: 80 },
  { month: "Фев", completedCourses: 7, averageScore: 75 },
  { month: "Мар", completedCourses: 10, averageScore: 82 },
  { month: "Апр", completedCourses: 8, averageScore: 78 },
  { month: "Май", completedCourses: 12, averageScore: 85 },
  { month: "Июн", completedCourses: 15, averageScore: 88 },
];

const topEmployees: EmployeeActivity[] = [
  { name: "Иван Петров", department: "Ресторан", completedCourses: 12, averageScore: 95, lastActivityDate: "2025-04-10" },
  { name: "Анна Смирнова", department: "Обслуживание номеров", completedCourses: 10, averageScore: 92, lastActivityDate: "2025-04-12" },
  { name: "Мария Иванова", department: "Адаптация", completedCourses: 9, averageScore: 90, lastActivityDate: "2025-04-08" },
  { name: "Алексей Сидоров", department: "Безопасность", completedCourses: 8, averageScore: 88, lastActivityDate: "2025-04-11" },
  { name: "Екатерина Козлова", department: "Работа с гостями", completedCourses: 7, averageScore: 85, lastActivityDate: "2025-04-09" },
];

// Цвета для графиков
const COLORS = ["#4f46e5", "#8b5cf6", "#06b6d4", "#2dd4bf", "#f43f5e", "#f59e0b"];

// Вспомогательная функция для форматирования дат
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

export default function Analytics() {
  const [period, setPeriod] = useState<"day" | "week" | "month" | "year">("month");
  const [, setLocation] = useLocation();
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <div className="container mx-auto p-4 md:p-6">
        {/* Заголовок и фильтры */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-semibold mb-4 md:mb-0">Аналитика обучения</h1>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={period === "day" ? "default" : "outline"} 
              size="sm"
              onClick={() => setPeriod("day")}
            >
              День
            </Button>
            <Button 
              variant={period === "week" ? "default" : "outline"} 
              size="sm"
              onClick={() => setPeriod("week")}
            >
              Неделя
            </Button>
            <Button 
              variant={period === "month" ? "default" : "outline"} 
              size="sm"
              onClick={() => setPeriod("month")}
            >
              Месяц
            </Button>
            <Button 
              variant={period === "year" ? "default" : "outline"} 
              size="sm"
              onClick={() => setPeriod("year")}
            >
              Год
            </Button>
            
            <Button variant="outline" className="ml-2">
              <span className="material-icons text-sm mr-1">file_download</span>
              Экспорт
            </Button>
          </div>
        </div>
        
        {/* Карточки с основными метриками */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Курсов запущено</CardTitle>
              <CardDescription>Всего активных курсов</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">12</div>
              <div className="text-sm text-green-600 flex items-center mt-1">
                <span className="material-icons text-sm mr-1">trending_up</span>
                +2 за последний месяц
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Активных участников</CardTitle>
              <CardDescription>Сотрудники в обучении</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">145</div>
              <div className="text-sm text-green-600 flex items-center mt-1">
                <span className="material-icons text-sm mr-1">trending_up</span>
                +23 за последний месяц
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Завершенных курсов</CardTitle>
              <CardDescription>Успешно пройдено</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">278</div>
              <div className="text-sm text-green-600 flex items-center mt-1">
                <span className="material-icons text-sm mr-1">trending_up</span>
                +45 за последний месяц
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Средний рейтинг</CardTitle>
              <CardDescription>Оценка курсов</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">4.7</div>
              <div className="text-sm text-green-600 flex items-center mt-1">
                <span className="material-icons text-sm mr-1">trending_up</span>
                +0.2 за последний месяц
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Основные графики */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="p-4">
            <CardHeader className="pb-2">
              <CardTitle>Завершенные курсы по месяцам</CardTitle>
              <CardDescription>
                Количество завершенных курсов сотрудниками
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyCourseCompletionData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="completions" 
                      stroke="#4f46e5" 
                      fillOpacity={1} 
                      fill="url(#colorCompletions)" 
                      name="Завершенные курсы"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="p-4">
            <CardHeader className="pb-2">
              <CardTitle>Распределение по отделам</CardTitle>
              <CardDescription>
                Процент завершения курсов по отделам
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="completionRate"
                      nameKey="name"
                    >
                      {departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [`${value}%`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Вкладки с дополнительной аналитикой */}
        <Tabs defaultValue="courses" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="courses">Курсы</TabsTrigger>
            <TabsTrigger value="employees">Сотрудники</TabsTrigger>
            <TabsTrigger value="departments">Отделы</TabsTrigger>
          </TabsList>
          
          <TabsContent value="courses">
            <Card className="p-4">
              <CardHeader className="pb-2">
                <CardTitle>Статистика завершения курсов</CardTitle>
                <CardDescription>Распределение статусов по каждому курсу</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={courseCompletionData}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="courseName" width={100} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completed" name="Завершено" stackId="a" fill="#4f46e5" />
                      <Bar dataKey="inProgress" name="В процессе" stackId="a" fill="#8b5cf6" />
                      <Bar dataKey="notStarted" name="Не начато" stackId="a" fill="#d1d5db" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setLocation("/courses")}
                  >
                    Просмотреть все курсы
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="employees">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-4">
                <CardHeader className="pb-2">
                  <CardTitle>Прогресс по месяцам</CardTitle>
                  <CardDescription>Динамика обучения сотрудников</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={employeeProgressData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" orientation="left" stroke="#4f46e5" />
                        <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" />
                        <Tooltip />
                        <Legend />
                        <Line 
                          yAxisId="left" 
                          type="monotone" 
                          dataKey="completedCourses" 
                          name="Завершенные курсы" 
                          stroke="#4f46e5" 
                          activeDot={{ r: 8 }} 
                        />
                        <Line 
                          yAxisId="right" 
                          type="monotone" 
                          dataKey="averageScore" 
                          name="Средний балл" 
                          stroke="#f43f5e" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="p-4">
                <CardHeader className="pb-2">
                  <CardTitle>Лучшие сотрудники</CardTitle>
                  <CardDescription>Топ сотрудников по завершенным курсам</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="space-y-4">
                    {topEmployees.map((employee, index) => (
                      <div key={index} className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-medium mr-3">
                            {employee.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-neutral-500">{employee.department}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{employee.completedCourses} курсов</div>
                          <div className="text-sm text-neutral-500">
                            Рейтинг: {employee.averageScore}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setLocation("/employees")}
                    >
                      Просмотреть всех сотрудников
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="departments">
            <Card className="p-4">
              <CardHeader className="pb-2">
                <CardTitle>Сравнение отделов</CardTitle>
                <CardDescription>Статистика обучения по отделам</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={departmentData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#4f46e5" />
                      <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        yAxisId="left" 
                        dataKey="completionRate" 
                        name="Процент завершения" 
                        fill="#4f46e5" 
                      />
                      <Bar 
                        yAxisId="right" 
                        dataKey="enrollmentCount" 
                        name="Количество зачислений" 
                        fill="#f43f5e" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {departmentData.map((dept, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: dept.color }}
                        ></div>
                        <div className="text-sm font-medium truncate">{dept.name}</div>
                      </div>
                      <div className="mt-2 flex justify-between">
                        <div className="text-xs text-neutral-500">Завершение:</div>
                        <div className="text-xs font-medium">{dept.completionRate}%</div>
                      </div>
                      <div className="flex justify-between">
                        <div className="text-xs text-neutral-500">Участников:</div>
                        <div className="text-xs font-medium">{dept.enrollmentCount}</div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Генерация отчетов */}
        <Card>
          <CardHeader>
            <CardTitle>Генерация отчетов</CardTitle>
            <CardDescription>Создание детальных отчетов по обучению</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="p-4 border-dashed">
                <div className="flex flex-col items-center text-center">
                  <span className="material-icons text-3xl text-primary mb-2">
                    summarize
                  </span>
                  <h3 className="font-medium mb-1">Общий отчет по обучению</h3>
                  <p className="text-sm text-neutral-500 mb-4">
                    Сводка по всем направлениям обучения за выбранный период
                  </p>
                  <Button size="sm">Создать отчет</Button>
                </div>
              </Card>
              
              <Card className="p-4 border-dashed">
                <div className="flex flex-col items-center text-center">
                  <span className="material-icons text-3xl text-primary mb-2">
                    diversity_3
                  </span>
                  <h3 className="font-medium mb-1">Отчет по отделам</h3>
                  <p className="text-sm text-neutral-500 mb-4">
                    Детальная статистика обучения по отделам
                  </p>
                  <Button size="sm">Создать отчет</Button>
                </div>
              </Card>
              
              <Card className="p-4 border-dashed">
                <div className="flex flex-col items-center text-center">
                  <span className="material-icons text-3xl text-primary mb-2">
                    person_search
                  </span>
                  <h3 className="font-medium mb-1">Отчет по сотрудникам</h3>
                  <p className="text-sm text-neutral-500 mb-4">
                    Индивидуальная статистика обучения сотрудников
                  </p>
                  <Button size="sm">Создать отчет</Button>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}