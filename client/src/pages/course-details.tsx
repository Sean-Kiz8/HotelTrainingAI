import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// Для демонстрации используем моковые данные
// В реальном приложении это будет получаться по ID курса
interface CourseLesson {
  id: number;
  title: string;
  duration: string;
  completed: boolean;
  type: "video" | "text" | "quiz";
}

interface CourseModule {
  id: number;
  title: string;
  description: string;
  lessons: CourseLesson[];
}

interface CourseDetail {
  id: number;
  title: string;
  description: string;
  fullDescription: string;
  department: string;
  participants: number;
  image: string;
  rating: number;
  ratingCount: number;
  duration: string;
  modules: CourseModule[];
  goals: string[];
  requirements: string[];
  instructors: {
    id: number;
    name: string;
    position: string;
    avatar: string;
  }[];
}

// Получение цветов для разных отделов
function getDepartmentColors(department: string): { bg: string, text: string } {
  switch (department) {
    case "Обслуживание номеров":
      return { bg: "bg-primary-light", text: "text-primary" };
    case "Ресторан":
      return { bg: "bg-secondary-light", text: "text-secondary" };
    case "Адаптация":
      return { bg: "bg-accent-light", text: "text-accent" };
    case "Работа с гостями":
      return { bg: "bg-blue-100", text: "text-blue-600" };
    case "Безопасность":
      return { bg: "bg-red-100", text: "text-red-600" };
    case "Мероприятия":
      return { bg: "bg-purple-100", text: "text-purple-600" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-600" };
  }
}

// Компонент для звездного рейтинга
function Stars({ rating, count }: { rating: number, count: number }) {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <span 
          key={i} 
          className={`material-icons text-sm ${
            i < Math.floor(rating) 
              ? 'text-yellow-400' 
              : i < rating 
                ? 'text-yellow-300'
                : 'text-neutral-300'
          }`}
        >
          {i < Math.floor(rating) 
            ? 'star' 
            : i < rating 
              ? 'star_half'
              : 'star'}
        </span>
      ))}
      <span className="text-neutral-500 text-xs ml-1">({count})</span>
    </div>
  );
}

// Пример данных курса для демонстрации
const exampleCourse: CourseDetail = {
  id: 1,
  title: "Стандарты обслуживания номеров",
  description: "Курс по стандартам уборки и подготовки номеров, правила работы с клиентами.",
  fullDescription: "Этот комплексный курс предназначен для персонала, отвечающего за обслуживание номеров в отеле. Вы изучите международные стандарты уборки, этикет взаимодействия с гостями, правила безопасности и гигиены, а также научитесь эффективно решать типичные проблемы, возникающие при обслуживании номеров.",
  department: "Обслуживание номеров",
  participants: 32,
  image: "room_service",
  rating: 4.2,
  ratingCount: 16,
  duration: "8 часов",
  goals: [
    "Изучить международные стандарты уборки номеров",
    "Освоить правила этикета при взаимодействии с гостями",
    "Научиться эффективно организовывать рабочий процесс",
    "Изучить правила безопасности и гигиены"
  ],
  requirements: [
    "Базовое знание правил гигиены",
    "Начальные навыки коммуникации"
  ],
  modules: [
    {
      id: 1,
      title: "Введение в обслуживание номеров",
      description: "Базовые принципы и стандарты обслуживания номеров",
      lessons: [
        {
          id: 101,
          title: "Структура отдела обслуживания номеров",
          duration: "15 минут",
          completed: true,
          type: "video"
        },
        {
          id: 102,
          title: "История развития стандартов обслуживания",
          duration: "20 минут",
          completed: true,
          type: "text"
        },
        {
          id: 103,
          title: "Ключевые показатели качества",
          duration: "25 минут",
          completed: false,
          type: "text"
        }
      ]
    },
    {
      id: 2,
      title: "Стандарты уборки и подготовки номеров",
      description: "Подробное руководство по поддержанию чистоты и порядка",
      lessons: [
        {
          id: 201,
          title: "Ежедневная уборка: пошаговая инструкция",
          duration: "30 минут",
          completed: false,
          type: "video"
        },
        {
          id: 202,
          title: "Генеральная уборка: процедуры и частота",
          duration: "25 минут",
          completed: false,
          type: "video"
        },
        {
          id: 203,
          title: "Проверка знаний по уборке номеров",
          duration: "15 минут",
          completed: false,
          type: "quiz"
        }
      ]
    },
    {
      id: 3,
      title: "Взаимодействие с гостями",
      description: "Коммуникация и решение проблем при обслуживании номеров",
      lessons: [
        {
          id: 301,
          title: "Правила этикета при встрече с гостями",
          duration: "20 минут",
          completed: false,
          type: "text"
        },
        {
          id: 302,
          title: "Обработка запросов и жалоб",
          duration: "25 минут",
          completed: false,
          type: "video"
        },
        {
          id: 303,
          title: "Симуляция сложных ситуаций",
          duration: "35 минут",
          completed: false,
          type: "text"
        },
        {
          id: 304,
          title: "Итоговый тест по обслуживанию гостей",
          duration: "20 минут",
          completed: false,
          type: "quiz"
        }
      ]
    }
  ],
  instructors: [
    {
      id: 1,
      name: "Анна Смирнова",
      position: "Старший менеджер по обслуживанию номеров",
      avatar: "person"
    },
    {
      id: 2,
      name: "Иван Петров",
      position: "Тренер по стандартам обслуживания",
      avatar: "person"
    }
  ]
};

function LessonIcon({ type }: { type: CourseLesson["type"] }) {
  switch (type) {
    case "video":
      return <span className="material-icons text-blue-500">videocam</span>;
    case "text":
      return <span className="material-icons text-green-500">article</span>;
    case "quiz":
      return <span className="material-icons text-orange-500">quiz</span>;
    default:
      return <span className="material-icons text-gray-500">description</span>;
  }
}

export default function CourseDetails() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  
  // В реальном приложении здесь будет логика получения курса по ID
  const course = exampleCourse;
  
  // Расчет прогресса выполнения курса
  const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
  const completedLessons = course.modules.reduce((acc, module) => {
    return acc + module.lessons.filter(lesson => lesson.completed).length;
  }, 0);
  const progressPercentage = Math.round((completedLessons / totalLessons) * 100);
  
  // Получаем стили для отдела
  const departmentStyle = getDepartmentColors(course.department);
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <div className="container mx-auto p-4 md:p-6">
        {/* Хлебные крошки */}
        <div className="flex items-center text-sm mb-4 text-neutral-500">
          <span 
            className="cursor-pointer hover:text-primary"
            onClick={() => setLocation("/")}
          >
            Главная
          </span>
          <span className="material-icons text-xs mx-1">chevron_right</span>
          <span 
            className="cursor-pointer hover:text-primary"
            onClick={() => setLocation("/courses")}
          >
            Курсы
          </span>
          <span className="material-icons text-xs mx-1">chevron_right</span>
          <span className="text-neutral-700 truncate max-w-xs">{course.title}</span>
        </div>
        
        {/* Шапка курса */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className={`w-20 h-20 rounded-lg ${departmentStyle.bg} flex items-center justify-center flex-shrink-0`}>
                <span className={`material-icons text-4xl ${departmentStyle.text}`}>{course.image}</span>
              </div>
              
              <div className="flex-grow">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className={`${departmentStyle.bg} ${departmentStyle.text} px-2 py-1 rounded-full text-xs inline-block mb-2`}>
                      {course.department}
                    </span>
                    <h1 className="text-2xl font-semibold">{course.title}</h1>
                  </div>
                  
                  <Button className="flex items-center gap-1">
                    <span className="material-icons text-sm">play_circle</span>
                    Начать обучение
                  </Button>
                </div>
                
                <p className="text-neutral-600 mt-2 mb-4">{course.description}</p>
                
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center">
                      <span className="material-icons text-neutral-500 mr-1">schedule</span>
                      <span className="text-sm text-neutral-600">{course.duration}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="material-icons text-neutral-500 mr-1">people</span>
                      <span className="text-sm text-neutral-600">{course.participants} участников</span>
                    </div>
                    <Stars rating={course.rating} count={course.ratingCount} />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-sm">
                      <span className="text-primary font-medium">{progressPercentage}%</span> выполнено
                    </div>
                    <Progress value={progressPercentage} className="w-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Основной контент курса */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая колонка с информацией */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Обзор</TabsTrigger>
                <TabsTrigger value="content">Содержание</TabsTrigger>
                <TabsTrigger value="discussions">Обсуждения</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">О курсе</h2>
                <p className="text-neutral-700 mb-6">{course.fullDescription}</p>
                
                <h3 className="text-lg font-medium mb-3">Чему вы научитесь</h3>
                <ul className="mb-6">
                  {course.goals.map((goal, index) => (
                    <li key={index} className="flex items-start mb-2">
                      <span className="material-icons text-green-500 mr-2">check_circle</span>
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
                
                <h3 className="text-lg font-medium mb-3">Требования к обучению</h3>
                <ul className="mb-6">
                  {course.requirements.map((req, index) => (
                    <li key={index} className="flex items-start mb-2">
                      <span className="material-icons text-primary mr-2">arrow_right</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
                
                <h3 className="text-lg font-medium mb-3">Преподаватели</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.instructors.map(instructor => (
                    <div key={instructor.id} className="flex items-center bg-neutral-50 p-4 rounded-lg">
                      <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center mr-3">
                        <span className="material-icons text-neutral-500">{instructor.avatar}</span>
                      </div>
                      <div>
                        <div className="font-medium">{instructor.name}</div>
                        <div className="text-sm text-neutral-500">{instructor.position}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Содержание курса</h2>
                <div className="text-sm text-neutral-500 mb-6">
                  {course.modules.length} модулей • {totalLessons} уроков • {course.duration}
                </div>
                
                <div className="space-y-4">
                  {course.modules.map((module, moduleIndex) => (
                    <div key={module.id} className="border rounded-lg overflow-hidden">
                      <div className="bg-neutral-50 p-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Модуль {moduleIndex + 1}: {module.title}</h3>
                          <p className="text-sm text-neutral-500 mt-1">{module.description}</p>
                        </div>
                        <span className="text-sm text-neutral-600">
                          {module.lessons.length} уроков
                        </span>
                      </div>
                      
                      <div className="divide-y">
                        {module.lessons.map(lesson => (
                          <div 
                            key={lesson.id} 
                            className={`p-4 flex items-center ${lesson.completed ? 'bg-green-50' : 'bg-white'}`}
                          >
                            <div className="mr-3">
                              {lesson.completed ? (
                                <span className="material-icons text-green-500">check_circle</span>
                              ) : (
                                <LessonIcon type={lesson.type} />
                              )}
                            </div>
                            
                            <div className="flex-grow">
                              <div className="font-medium">{lesson.title}</div>
                              <div className="flex items-center text-sm text-neutral-500">
                                <span className="material-icons text-xs mr-1">schedule</span>
                                {lesson.duration}
                              </div>
                            </div>
                            
                            <Button 
                              variant={lesson.completed ? "outline" : "default"} 
                              size="sm"
                              className="ml-2"
                            >
                              {lesson.completed ? "Повторить" : "Начать"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="discussions" className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Обсуждения</h2>
                  <Button>Создать тему</Button>
                </div>
                
                <div className="bg-neutral-100 p-8 rounded-lg text-center">
                  <span className="material-icons text-4xl text-neutral-400 mb-2">forum</span>
                  <p className="text-neutral-600 mb-2">В этом курсе пока нет обсуждений</p>
                  <p className="text-sm text-neutral-500 mb-4">Будьте первым, кто начнет обсуждение!</p>
                  <Button variant="outline">Создать первую тему</Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Правая колонка с прогрессом */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="font-medium mb-3">Ваш прогресс</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-600">Выполнено</span>
                <span className="text-sm font-medium">{completedLessons}/{totalLessons} уроков</span>
              </div>
              <Progress value={progressPercentage} className="mb-4" />
              
              {progressPercentage < 100 ? (
                <Button className="w-full flex items-center justify-center gap-1">
                  <span className="material-icons text-sm">play_arrow</span>
                  Продолжить обучение
                </Button>
              ) : (
                <Button variant="outline" className="w-full">Пройти повторно</Button>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="font-medium mb-4">Можете поделиться</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <span className="material-icons text-sm">people</span>
                  Пригласить
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <span className="material-icons text-sm">content_copy</span>
                  Копировать ссылку
                </Button>
              </div>
            </div>
            
            <div className="bg-primary-light rounded-lg p-6">
              <h3 className="font-medium text-primary mb-3">Нужна помощь?</h3>
              <p className="text-sm text-neutral-700 mb-4">
                Если у вас есть вопросы по материалу курса, вы можете обратиться к преподавателю или использовать нашего чат-бота.
              </p>
              <Button variant="outline" className="w-full bg-white text-primary hover:bg-white/90 flex items-center justify-center gap-1">
                <span className="material-icons text-sm">smart_toy</span>
                Спросить у чат-бота
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}