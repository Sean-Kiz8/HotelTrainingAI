import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, SearchInput, CreateButton } from "@/components/layout/page-header";
import { CourseCard } from "@/components/dashboard/course-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CreateCourseDialog } from "@/components/courses/create-course-dialog";
import { getQueryFn } from "@/lib/queryClient";
import { Course } from "@shared/schema";

export default function Courses() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Fetch all courses
  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Filter courses by search query
  const filteredCourses = courses.filter((course: Course) => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.department.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Group courses by department
  const departmentGroups = filteredCourses.reduce<Record<string, Course[]>>((acc, course) => {
    if (!acc[course.department]) {
      acc[course.department] = [];
    }
    acc[course.department].push(course);
    return acc;
  }, {});
  
  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <PageHeader title="Курсы">
        <SearchInput 
          placeholder="Поиск курсов..." 
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <CreateButton 
          label="Создать курс"
          onClick={() => setIsCreateDialogOpen(true)}
        />
      </PageHeader>
      
      <CreateCourseDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
      />
      
      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">Все курсы</TabsTrigger>
          <TabsTrigger value="active">Активные</TabsTrigger>
          <TabsTrigger value="draft">Черновики</TabsTrigger>
          <TabsTrigger value="archived">Архив</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-72" />
              ))}
            </div>
          ) : (
            <>
              {departmentGroups && Object.keys(departmentGroups).length > 0 ? (
                Object.entries(departmentGroups).map(([department, departmentCourses]: [string, Course[]]) => (
                  <div key={department} className="mb-8">
                    <h3 className="font-sans font-semibold text-lg mb-4">{department}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {departmentCourses.map((course: Course) => (
                        <CourseCard
                          key={course.id}
                          id={course.id}
                          title={course.title}
                          description={course.description}
                          department={course.department}
                          participantCount={course.participantCount}
                          image={course.image}
                          rating={4}
                          ratingCount={16}
                          onClick={() => {
                            toast({
                              title: "Просмотр курса",
                              description: `Выбран курс: ${course.title}`,
                            });
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  {searchQuery ? (
                    <p>Курсы по запросу "{searchQuery}" не найдены</p>
                  ) : (
                    <p>Нет доступных курсов</p>
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="active" className="mt-4">
          <div className="text-center py-12 text-neutral-500">
            <p>Эта функциональность находится в разработке</p>
          </div>
        </TabsContent>
        
        <TabsContent value="draft" className="mt-4">
          <div className="text-center py-12 text-neutral-500">
            <p>Эта функциональность находится в разработке</p>
          </div>
        </TabsContent>
        
        <TabsContent value="archived" className="mt-4">
          <div className="text-center py-12 text-neutral-500">
            <p>Эта функциональность находится в разработке</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
