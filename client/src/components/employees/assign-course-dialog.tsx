import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface AssignCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: number;
  employeeName: string;
}

export function AssignCourseDialog({ 
  open, 
  onOpenChange, 
  employeeId, 
  employeeName 
}: AssignCourseDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Получаем все курсы
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ["/api/courses"],
    enabled: open,
  });
  
  // Получаем записи на курсы для сотрудника
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery({
    queryKey: [`/api/enrollments?userId=${employeeId}`],
    enabled: open && !!employeeId,
  });
  
  // Фильтруем курсы по поисковому запросу
  const filteredCourses = courses.filter((course: any) => {
    // Проверяем, что курс соответствует поисковому запросу
    const matchesSearch = !searchQuery || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Проверяем, что сотрудник еще не записан на этот курс
    const isNotEnrolled = !enrollments.some((enrollment: any) => 
      enrollment.courseId === course.id
    );
    
    return matchesSearch && isNotEnrolled;
  });
  
  // Мутация для записи на курс
  const enrollMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: employeeId,
          courseId: courseId,
          progress: 0,
          completed: false
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Не удалось записать на курс");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Инвалидируем кэш запросов, чтобы обновить данные
      queryClient.invalidateQueries({ queryKey: [`/api/enrollments?userId=${employeeId}`] });
      
      toast({
        title: "Курс назначен",
        description: `Сотрудник успешно записан на курс`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Обработчик назначения курса
  const handleAssignCourse = (courseId: number, courseTitle: string) => {
    enrollMutation.mutate(courseId);
    toast({
      title: "Назначение курса",
      description: `Назначен курс "${courseTitle}" для сотрудника ${employeeName}`,
    });
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Назначить курс</DialogTitle>
          <DialogDescription>
            Выберите курс для назначения сотруднику {employeeName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-4">
          <Input
            placeholder="Поиск курсов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        
        <ScrollArea className="h-[400px] pr-4">
          {isLoadingCourses || isLoadingEnrollments ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="space-y-3">
              {filteredCourses.map((course: any) => (
                <div 
                  key={course.id} 
                  className="border rounded-md p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{course.title}</h4>
                      <p className="text-sm text-neutral-500 line-clamp-2 mt-1">
                        {course.description}
                      </p>
                      <div className="mt-2">
                        <Badge variant="outline">{course.department}</Badge>
                        <Badge variant="outline" className="ml-2">
                          {course.participantCount} участников
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => handleAssignCourse(course.id, course.title)}
                      disabled={enrollMutation.isPending}
                    >
                      Назначить
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500">
              {searchQuery ? (
                <p>Курсы по запросу "{searchQuery}" не найдены или уже назначены</p>
              ) : (
                <p>Нет доступных курсов для назначения</p>
              )}
            </div>
          )}
        </ScrollArea>
        
        <div className="flex justify-end mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="mr-2"
          >
            Отмена
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
