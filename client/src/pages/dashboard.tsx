import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, SearchInput, CreateButton } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { OnboardingStatus } from "@/components/dashboard/onboarding-status";
import { CourseCard } from "@/components/dashboard/course-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  
  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });
  
  // Fetch courses
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["/api/courses"],
  });
  
  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <PageHeader title="Панель управления">
        <SearchInput placeholder="Поиск..." />
        <CreateButton 
          label="Создать курс"
          onClick={() => toast({
            title: "Создание курса",
            description: "Функциональность находится в разработке",
          })}
        />
      </PageHeader>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsLoading ? (
          [...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))
        ) : (
          <>
            <StatCard
              icon="person"
              iconColor="text-primary"
              title="Всего сотрудников"
              value={stats?.totalEmployees || 0}
              change={{ value: "+8% с прошлого месяца", trend: "up" }}
            />
            <StatCard
              icon="menu_book"
              iconColor="text-secondary"
              title="Активных курсов"
              value={stats?.activeCourses || 0}
              change={{ value: "+3 новых курса", trend: "up" }}
            />
            <StatCard
              icon="school"
              iconColor="text-accent"
              title="Завершенных курсов"
              value={stats?.completedCourses || 0}
              change={{ value: "+12% с прошлого месяца", trend: "up" }}
            />
            <StatCard
              icon="insights"
              iconColor="text-warning"
              title="Средний прогресс"
              value={stats?.averageProgress || "0%"}
              change={{ value: "-2% с прошлого месяца", trend: "down" }}
            />
          </>
        )}
      </div>
      
      {/* Recent Activity and Onboarding Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <RecentActivity />
        <OnboardingStatus />
      </div>
      
      {/* Recent Courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-sans font-semibold text-lg">Недавние курсы</h3>
          <Button variant="link" className="text-primary text-sm hover:text-primary-dark flex items-center">
            Все курсы
            <span className="material-icons text-sm ml-1">arrow_forward</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coursesLoading ? (
            [...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))
          ) : (
            courses?.slice(0, 3).map((course: any) => (
              <CourseCard
                key={course.id}
                title={course.title}
                description={course.description}
                department={course.department}
                participantCount={course.participantCount}
                image={course.image}
                rating={4}
                ratingCount={16}
                onClick={() => toast({
                  title: "Просмотр курса",
                  description: `Выбран курс: ${course.title}`,
                })}
              />
            ))
          )}
          
          {!coursesLoading && (!courses || courses.length === 0) && (
            <div className="col-span-full text-center py-8 text-neutral-500">
              <p>Нет доступных курсов</p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => toast({
                  title: "Создание курса",
                  description: "Функциональность находится в разработке",
                })}
              >
                <span className="material-icons text-sm mr-1">add</span>
                Создать первый курс
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
