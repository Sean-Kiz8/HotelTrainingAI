import { useState } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertCourseSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Расширяем схему валидации с дополнительными правилами
const createCourseSchema = insertCourseSchema.extend({
  title: z.string().min(3, { message: "Название должно содержать не менее 3 символов" }),
  description: z.string().min(10, { message: "Описание должно содержать не менее 10 символов" }),
  department: z.string().min(1, { message: "Выберите отдел" }),
});

// Определяем тип формы на основе схемы
type CreateCourseFormValues = z.infer<typeof createCourseSchema>;

export default function CreateCourse() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Состояние для отслеживания процесса загрузки изображения
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Инициализация формы
  const form = useForm<CreateCourseFormValues>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      title: "",
      description: "",
      department: "",
      image: null,
      createdById: 1, // ID текущего пользователя (в реальном приложении берем из контекста)
    },
  });
  
  // Мутация для создания курса
  const createCourseMutation = useMutation({
    mutationFn: async (data: CreateCourseFormValues) => {
      const response = await apiRequest("POST", "/api/courses", data);
      return await response.json();
    },
    onSuccess: () => {
      // Сбрасываем кэш для обновления списка курсов
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      
      // Показываем уведомление об успехе
      toast({
        title: "Курс создан",
        description: "Новый курс успешно добавлен в систему",
      });
      
      // Переходим на страницу курсов
      setLocation("/courses");
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка создания курса",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: CreateCourseFormValues) => {
    // Добавляем выбранное изображение, если оно есть
    createCourseMutation.mutate({
      ...data,
      image: selectedImage,
    });
  };
  
  // Для имитации загрузки изображения
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // В реальном приложении здесь был бы код для загрузки файла на сервер
      // Для демонстрации просто используем локальный URL
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      
      // Обновляем поле формы
      form.setValue("image", imageUrl);
    }
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-8">Создание нового курса</h1>
      
      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Название курса */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название курса</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите название курса" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Отдел */}
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Отдел</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите отдел" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Обслуживание номеров">Обслуживание номеров</SelectItem>
                      <SelectItem value="Ресторан">Ресторан</SelectItem>
                      <SelectItem value="Адаптация">Адаптация</SelectItem>
                      <SelectItem value="Ресепшн">Ресепшн</SelectItem>
                      <SelectItem value="Общий">Общий</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Описание */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание курса</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Введите описание курса" 
                      className="min-h-32"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Изображение курса */}
            <div className="space-y-2">
              <FormLabel className="inline-block">Изображение курса</FormLabel>
              <div className="flex flex-col gap-2">
                <Input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="max-w-md"
                />
                
                {selectedImage && (
                  <div className="relative mt-2 rounded overflow-hidden max-w-md h-40">
                    <img 
                      src={selectedImage} 
                      alt="Превью курса" 
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setSelectedImage(null);
                        form.setValue("image", null);
                      }}
                    >
                      <span className="material-icons text-sm">delete</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Кнопки управления */}
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setLocation("/courses")}
              >
                Отмена
              </Button>
              <Button 
                type="submit"
                disabled={createCourseMutation.isPending}
              >
                {createCourseMutation.isPending ? (
                  <>
                    <span className="material-icons animate-spin mr-2">refresh</span>
                    Создание...
                  </>
                ) : "Создать курс"}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}