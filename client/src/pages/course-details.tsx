import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Course } from "@shared/schema";
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/page-header";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronLeft, Users, Clock, Award, BookOpen, Copy, Mail, 
  Plus, Edit, Eye, Trash2, MoreHorizontal 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ShareWidget } from "@/components/course/share-widget";
import { SharePreviewCard } from "@/components/course/share-preview-card";
import { ModuleToast, LessonToast } from "@/components/course/module-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Импортируем формы для модулей и уроков
import { AddModuleForm, createModuleSchema } from "@/components/course/module-form";
import { AddLessonForm, createLessonSchema } from "@/components/course/lesson-form";
import { z } from "zod";

// Интерфейсы для модулей и уроков
interface IModule {
  id: number;
  title: string;
  description: string;
  orderIndex: number;
  courseId: number;
  lessons?: ILesson[];
}

interface ILesson {
  id: number;
  title: string;
  description: string;
  content: string;
  durationMinutes: number;
  moduleId: number;
  orderIndex: number;
}

export default function CourseDetailsPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const courseId = params.id ? parseInt(params.id) : undefined;
  const [showAddModuleDialog, setShowAddModuleDialog] = useState(false);
  const [showAddLessonDialog, setShowAddLessonDialog] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);
  
  // Fetch course by ID
  const { data: course, isLoading: isLoadingCourse, error } = useQuery<Course>({
    queryKey: [`/api/courses/${courseId}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!courseId
  });
  
  // Fetch modules for this course
  const { data: modules = [], isLoading: isLoadingModules } = useQuery<IModule[]>({
    queryKey: [`/api/modules?courseId=${courseId}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!courseId
  });
  
  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createModuleSchema>) => {
      const res = await apiRequest("POST", "/api/modules", {
        ...data,
        courseId,
        orderIndex: modules.length + 1
      });
      return await res.json();
    },
    onSuccess: (createdModule) => {
      queryClient.invalidateQueries({ queryKey: [`/api/modules?courseId=${courseId}`] });
      toast({
        description: (
          <ModuleToast module={createdModule} courseId={Number(courseId)} />
        ),
        duration: 5000,
        className: "group p-4"
      });
      setShowAddModuleDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Ошибка при создании модуля",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Create lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createLessonSchema>) => {
      const res = await apiRequest("POST", "/api/lessons", data);
      return await res.json();
    },
    onSuccess: (createdLesson) => {
      queryClient.invalidateQueries({ queryKey: [`/api/modules?courseId=${courseId}`] });
      
      // Найдем модуль, к которому относится урок
      const module = modules.find(mod => mod.id === createdLesson.moduleId);
      
      toast({
        description: (
          <LessonToast 
            lessonTitle={createdLesson.title}
            moduleTitle={module?.title || 'Модуль'} 
            courseId={Number(courseId)}
          />
        ),
        duration: 5000,
        className: "group p-4"
      });
      
      setShowAddLessonDialog(false);
      setActiveModuleId(null);
    },
    onError: (error) => {
      toast({
        title: "Ошибка при создании урока",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Добавить урок в модуль
  const handleAddLesson = (moduleId: number) => {
    setActiveModuleId(moduleId);
    setShowAddLessonDialog(true);
  };
  
  // Handle loading state
  if (isLoadingCourse || isLoadingModules) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-12 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-6" />
        <Skeleton className="h-64 w-full mb-4" />
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }
  
  // Handle error
  if (error || !course) {
    return (
      <div className="p-4 md:p-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="mb-4"
          onClick={() => setLocation('/courses')}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Назад к курсам
        </Button>
        
        <Card className="text-center p-8">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Курс не найден</h2>
            <p className="text-muted-foreground mb-4">
              Курс с идентификатором {courseId} не существует или был удален
            </p>
            <Button onClick={() => setLocation('/courses')}>
              Вернуться к списку курсов
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Определение цветов для департамента
  const getDepartmentStyles = (department: string): { bg: string, text: string } => {
    switch (department) {
      case "Обслуживание номеров":
        return { bg: "bg-primary-light", text: "text-primary" };
      case "Ресторан":
        return { bg: "bg-secondary-light", text: "text-secondary" };
      case "Адаптация":
        return { bg: "bg-accent-light", text: "text-accent" };
      default:
        return { bg: "bg-neutral-200", text: "text-neutral-700" };
    }
  };
  
  const { bg, text } = getDepartmentStyles(course.department);
  
  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setLocation('/courses')}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Назад к курсам
        </Button>
        
        <ShareWidget 
          courseId={course.id} 
          courseTitle={course.title} 
        />
      </div>
      
      <PageHeader className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className={`${bg} ${text} border-0 px-2 py-1 rounded-full`}>
            {course.department}
          </Badge>
        </div>
        <PageHeaderHeading>{course.title}</PageHeaderHeading>
        <PageHeaderDescription>{course.description}</PageHeaderDescription>
      </PageHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Участников</p>
              <p className="text-lg font-medium">{course.participantCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-secondary" />
            <div>
              <p className="text-sm text-muted-foreground">Модулей</p>
              <p className="text-lg font-medium">{modules?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <Clock className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Длительность</p>
              <p className="text-lg font-medium">-- час.</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="content" className="mb-6">
        <TabsList>
          <TabsTrigger value="content">Содержание</TabsTrigger>
          <TabsTrigger value="students">Участники</TabsTrigger>
          <TabsTrigger value="analytics">Аналитика</TabsTrigger>
          <TabsTrigger value="share">Поделиться</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="mt-4">
          <div className="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h3 className="text-lg font-medium mb-4">Модули и уроки</h3>
            
            {isLoadingModules ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : modules && modules.length > 0 ? (
              <div className="space-y-4">
                <Accordion type="single" collapsible className="w-full">
                  {modules.map((module) => (
                    <AccordionItem key={module.id} value={`module-${module.id}`}>
                      <AccordionTrigger className="hover:bg-muted/50 px-4 py-2 rounded-md">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center">
                            <span className="material-icons mr-2 text-primary text-lg">folder</span>
                            <span>{module.title}</span>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {module.lessons?.length || 0} уроков
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pl-8 pr-2 pb-1">
                        {module.lessons && module.lessons.length > 0 ? (
                          <div className="space-y-2">
                            {module.lessons.map((lesson) => (
                              <div 
                                key={lesson.id} 
                                className="flex items-center justify-between border rounded-md p-3 hover:bg-muted/50"
                              >
                                <div className="flex items-center">
                                  <span className="material-icons mr-2 text-muted-foreground">description</span>
                                  <span>{lesson.title}</span>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Edit className="h-4 w-4 mr-2" />
                                      <span>Редактировать</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Eye className="h-4 w-4 mr-2" />
                                      <span>Предпросмотр</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      <span>Удалить</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            ))}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full justify-start mt-2"
                              onClick={() => handleAddLesson(module.id)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Добавить урок
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            <p className="text-sm">В этом модуле пока нет уроков</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => handleAddLesson(module.id)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Добавить урок
                            </Button>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowAddModuleDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить модуль
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>У этого курса пока нет модулей</p>
                <Button 
                  className="mt-3" 
                  variant="outline"
                  onClick={() => setShowAddModuleDialog(true)}
                >
                  Добавить модуль
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="students" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Участники курса</h3>
              
              <div className="text-center py-12 text-muted-foreground">
                <p>У этого курса пока нет участников</p>
                <Button className="mt-3" variant="outline">
                  Добавить участников
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Аналитика по курсу</h3>
              
              <div className="text-center py-12 text-muted-foreground">
                <p>Для просмотра аналитики нужно добавить участников в курс</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="share" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Поделиться курсом</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Создайте ссылку для доступа к курсу. Вы можете поделиться ею со своей командой или отправить по электронной почте.
                  </p>
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <Input 
                        readOnly 
                        value={`https://lms.hotel-training.com/course/${course.id}`} 
                        className="flex-1" 
                      />
                      <Button variant="outline" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Mail className="mr-2 h-4 w-4" />
                      Отправить по email
                    </Button>
                  </div>
                </div>
                
                <SharePreviewCard 
                  id={course.id}
                  title={course.title} 
                  description={course.description}
                  instructor={{
                    name: "Ваше Имя"
                  }}
                  department={course.department}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Диалог для добавления нового модуля */}
      <Dialog open={showAddModuleDialog} onOpenChange={setShowAddModuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить новый модуль</DialogTitle>
            <DialogDescription>
              Модуль - это раздел курса, который объединяет связанные уроки.
            </DialogDescription>
          </DialogHeader>
          
          <AddModuleForm
            courseId={courseId!}
            onSubmit={(data) => {
              createModuleMutation.mutate(data);
            }}
            isPending={createModuleMutation.isPending}
          />
        </DialogContent>
      </Dialog>
      
      {/* Диалог для добавления нового урока */}
      <Dialog open={showAddLessonDialog} onOpenChange={setShowAddLessonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить новый урок</DialogTitle>
            <DialogDescription>
              Добавьте урок в выбранный модуль. Уроки - это единицы обучения, которые содержат обучающий контент.
            </DialogDescription>
          </DialogHeader>
          
          <AddLessonForm
            moduleId={activeModuleId!}
            onSubmit={(data) => {
              createLessonMutation.mutate(data);
            }}
            isPending={createLessonMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}