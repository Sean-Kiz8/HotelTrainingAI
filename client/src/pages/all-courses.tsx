import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";

// Типы данных
interface Course {
  id: number;
  title: string;
  description: string;
  department: string;
  participants: number;
  image: string;
  rating: number;
  ratingCount: number;
}

// Список курсов (в реальном приложении данные будут загружаться с сервера)
const coursesData: Course[] = [
  {
    id: 1,
    title: "Стандарты обслуживания номеров",
    description: "Курс по стандартам уборки и подготовки номеров, правила работы с клиентами.",
    department: "Обслуживание номеров",
    participants: 32,
    image: "room_service",
    rating: 4.2,
    ratingCount: 16
  },
  {
    id: 2,
    title: "Ресторанный сервис",
    description: "Основы ресторанного обслуживания, стандарты сервировки и работа с клиентами.",
    department: "Ресторан",
    participants: 28,
    image: "restaurant",
    rating: 4.8,
    ratingCount: 22
  },
  {
    id: 3,
    title: "Базовый курс для новых сотрудников",
    description: "Основы работы в отеле, структура, правила внутреннего распорядка.",
    department: "Адаптация",
    participants: 48,
    image: "people",
    rating: 4.1,
    ratingCount: 36
  },
  {
    id: 4,
    title: "Управление конфликтами с гостями",
    description: "Как эффективно решать конфликтные ситуации и работать с трудными клиентами.",
    department: "Работа с гостями",
    participants: 25,
    image: "psychology",
    rating: 4.6,
    ratingCount: 19
  },
  {
    id: 5,
    title: "Пожарная безопасность",
    description: "Базовые принципы пожарной безопасности, действия в чрезвычайных ситуациях.",
    department: "Безопасность",
    participants: 56,
    image: "local_fire_department",
    rating: 4.4,
    ratingCount: 31
  },
  {
    id: 6,
    title: "Эффективное общение с гостями",
    description: "Техники коммуникации, работа с запросами гостей, создание позитивного опыта.",
    department: "Работа с гостями",
    participants: 35,
    image: "groups",
    rating: 4.7,
    ratingCount: 24
  },
  {
    id: 7,
    title: "Организация мероприятий в отеле",
    description: "Планирование, подготовка и проведение мероприятий различного формата.",
    department: "Мероприятия",
    participants: 18,
    image: "event_available",
    rating: 4.3,
    ratingCount: 12
  },
  {
    id: 8,
    title: "Основы бариста",
    description: "Техники приготовления кофе, виды кофейных напитков, работа с оборудованием.",
    department: "Ресторан",
    participants: 15,
    image: "coffee",
    rating: 4.9,
    ratingCount: 11
  },
  {
    id: 9,
    title: "Первая медицинская помощь",
    description: "Основные навыки оказания первой помощи в экстренных ситуациях.",
    department: "Безопасность",
    participants: 42,
    rating: 4.5,
    ratingCount: 28,
    image: "medication"
  }
];

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

// Компонент отображения курса
function CourseCard({ course }: { course: Course }) {
  const departmentStyle = getDepartmentColors(course.department);
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className={`h-40 ${departmentStyle.bg} flex items-center justify-center`}>
        <span className={`material-icons text-5xl ${departmentStyle.text}`}>{course.image}</span>
      </div>
      <div className="p-4">
        <div className="flex justify-between">
          <span className={`${departmentStyle.bg} ${departmentStyle.text} px-2 py-1 rounded-full text-xs`}>
            {course.department}
          </span>
          <span className="text-neutral-500 text-xs">{course.participants} участников</span>
        </div>
        <h4 className="font-medium text-lg mt-2 line-clamp-1">{course.title}</h4>
        <p className="text-neutral-600 text-sm mt-1 line-clamp-2">{course.description}</p>
        <div className="mt-3 flex justify-between items-center">
          <Stars rating={course.rating} count={course.ratingCount} />
          <button className="text-primary text-sm hover:text-primary-dark">
            Подробнее
          </button>
        </div>
      </div>
    </div>
  );
}

// Фильтр для отделов
const departments = ["Все отделы", "Обслуживание номеров", "Ресторан", "Адаптация", "Работа с гостями", "Безопасность", "Мероприятия"];

export default function AllCourses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("Все отделы");
  
  // Фильтрация курсов
  const filteredCourses = coursesData.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === "Все отделы" || course.department === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  });
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-semibold mb-4 md:mb-0">Все курсы</h1>
          
          <div className="w-full md:w-auto flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
            <Input
              type="text"
              placeholder="Поиск курсов..."
              className="md:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
        
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <span className="material-icons text-4xl text-neutral-400 mb-2">search_off</span>
            <p className="text-neutral-600">По вашему запросу ничего не найдено</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => {
                setSearchQuery("");
                setSelectedDepartment("Все отделы");
              }}
            >
              Сбросить фильтры
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}