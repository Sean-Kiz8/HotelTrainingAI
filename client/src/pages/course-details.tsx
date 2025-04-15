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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

export default function CourseDetailsPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const courseId = params.id ? parseInt(params.id) : undefined;
  
  // Fetch course by ID
  const { data: course, isLoading, error } = useQuery<Course>({
    queryKey: [`/api/courses/${courseId}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!courseId
  });
  
  // Handle loading state
  if (isLoading) {
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
              <p className="text-lg font-medium">0</p>
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
            
            {isLoading ? (
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
              <h3 className="text-lg font-medium mb-4">Аналитика курса</h3>
              
              <div className="text-center py-12 text-muted-foreground">
                <p>Аналитика будет доступна, когда курс начнут проходить участники</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="share" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Поделиться курсом</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Предпросмотр курса</h4>
                    <SharePreviewCard 
                      id={course.id}
                      title={course.title}
                      description={course.description}
                      department={course.department}
                      image={course.image}
                      instructor={{
                        name: "Иван Петров",
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">QR-код для быстрого доступа</h4>
                    <div className="w-40 h-40 bg-neutral-100 flex items-center justify-center">
                      <span className="text-neutral-500 text-sm">QR код</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Отсканируйте этот QR-код, чтобы получить доступ к курсу на мобильном устройстве
                    </p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Пригласить участников по email</h4>
                    <div className="flex flex-col gap-3">
                      <Input 
                        placeholder="Введите email адрес" 
                        type="email" 
                        id="email-1"
                      />
                      <Input 
                        placeholder="Добавить еще email адрес" 
                        type="email"
                        id="email-2" 
                      />
                      <Button 
                        className="w-full md:w-fit"
                        onClick={() => {
                          const email1 = (document.getElementById('email-1') as HTMLInputElement)?.value;
                          const email2 = (document.getElementById('email-2') as HTMLInputElement)?.value;
                          
                          const emails = [email1, email2].filter(email => 
                            email && email.includes('@') && email.includes('.')
                          );
                          
                          if (emails.length === 0) {
                            toast({
                              title: "Ошибка отправки",
                              description: "Пожалуйста, введите хотя бы один корректный email",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          // В реальном приложении здесь был бы API запрос
                          toast({
                            title: "Приглашения отправлены",
                            description: `Приглашения на курс "${course.title}" отправлены на ${emails.join(', ')}`,
                          });
                          
                          // Очищаем поля
                          if (document.getElementById('email-1')) {
                            (document.getElementById('email-1') as HTMLInputElement).value = '';
                          }
                          if (document.getElementById('email-2')) {
                            (document.getElementById('email-2') as HTMLInputElement).value = '';
                          }
                        }}
                      >
                        <Mail className="h-4 w-4 mr-2" /> Отправить приглашения
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Ссылка на курс</h4>
                    <div className="flex">
                      <Input 
                        value={`${window.location.origin}/course-details/${course.id}`}
                        readOnly
                        className="rounded-r-none"
                      />
                      <Button
                        className="rounded-l-none"
                        variant="secondary"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/course-details/${course.id}`);
                          toast({
                            title: "Ссылка скопирована",
                            description: "Ссылка на курс скопирована в буфер обмена",
                          });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Поделиться в социальных сетях</h4>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          const text = encodeURIComponent(`Приглашаю на курс: ${course.title}`);
                          const url = encodeURIComponent(`${window.location.origin}/course-details/${course.id}`);
                          window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
                        }}
                      >
                        Telegram
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          const text = encodeURIComponent(`Приглашаю на курс: ${course.title} ${window.location.origin}/course-details/${course.id}`);
                          window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                        }}
                      >
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}