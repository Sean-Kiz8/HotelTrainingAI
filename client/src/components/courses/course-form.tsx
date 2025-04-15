import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { insertCourseSchema, MediaFile as DBMediaFile } from "@shared/schema";
import { Button } from "@/components/ui/button";

// Пользовательский тип для работы с медиа-файлами
interface MediaFile extends DBMediaFile {
  name: string; // Алиас для originalFilename
}

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MediaSelector } from "@/components/media/media-selector";
import { Loader2 } from "lucide-react";

// Расширяем схему для валидации формы
const formSchema = insertCourseSchema.extend({
  title: z.string().min(3, {
    message: "Название курса должно содержать минимум 3 символа.",
  }),
  description: z.string().min(10, {
    message: "Описание должно содержать минимум 10 символов.",
  }),
  department: z.string().min(1, {
    message: "Выберите отдел.",
  }),
});

interface CourseFormProps {
  defaultValues?: z.infer<typeof formSchema>;
  onSuccess?: () => void;
  isEdit?: boolean;
  courseId?: number;
}

export function CourseForm({ 
  defaultValues, 
  onSuccess, 
  isEdit = false,
  courseId
}: CourseFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(defaultValues?.image || "");

  // Инициализация формы с дефолтными значениями
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      title: "",
      description: "",
      department: "",
      image: "",
      createdById: user?.id || 1,
      active: true,
    },
  });

  // При изменении пользователя обновляем значение createdById
  useEffect(() => {
    if (user && !isEdit) {
      form.setValue("createdById", user.id);
    }
  }, [user, form, isEdit]);

  // Мутация для создания или обновления курса
  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (isEdit && courseId) {
        // Обновляем существующий курс
        const res = await apiRequest("PATCH", `/api/courses/${courseId}`, data);
        return res.json();
      } else {
        // Создаем новый курс
        const res = await apiRequest("POST", "/api/courses", data);
        return res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: isEdit ? "Курс обновлен" : "Курс создан",
        description: isEdit 
          ? "Курс был успешно обновлен" 
          : "Новый курс был успешно добавлен",
        variant: "default",
      });
      
      // Инвалидируем запрос списка курсов
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      
      // Сбрасываем форму, если это не редактирование
      if (!isEdit) {
        form.reset();
      }
      
      // Вызываем колбэк успешного завершения
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось ${isEdit ? "обновить" : "создать"} курс: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Обработчик отправки формы
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Добавляем выбранное изображение
    const dataWithImage = {
      ...values,
      image: selectedImageUrl,
    };
    mutation.mutate(dataWithImage);
  }

  // Обработчик открытия селектора медиа
  const handleOpenMediaSelector = () => {
    setShowMediaSelector(true);
  };
  
  // Обработчик выбора изображения
  const handleSelectMedia = (mediaFile: MediaFile) => {
    setSelectedImageUrl(mediaFile.url);
    form.setValue("image", mediaFile.url);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Описание</FormLabel>
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
                  <SelectItem value="Ресепшн">Ресепшн</SelectItem>
                  <SelectItem value="Размещение">Размещение</SelectItem>
                  <SelectItem value="Ресторан">Ресторан</SelectItem>
                  <SelectItem value="Бар">Бар</SelectItem>
                  <SelectItem value="Кухня">Кухня</SelectItem>
                  <SelectItem value="Обслуживание номеров">Обслуживание номеров</SelectItem>
                  <SelectItem value="Инженерная служба">Инженерная служба</SelectItem>
                  <SelectItem value="Хозяйственная служба">Хозяйственная служба</SelectItem>
                  <SelectItem value="Безопасность">Безопасность</SelectItem>
                  <SelectItem value="Общие знания">Общие знания</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-3">
          <Label>Обложка курса</Label>
          
          <div className="flex flex-col gap-3">
            {selectedImageUrl ? (
              <div className="relative rounded-md overflow-hidden border border-border">
                <img 
                  src={selectedImageUrl} 
                  alt="Изображение курса" 
                  className="w-full h-44 object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button 
                    type="button"
                    size="sm" 
                    variant="secondary"
                    onClick={handleOpenMediaSelector}
                  >
                    Изменить
                  </Button>
                  <Button 
                    type="button"
                    size="sm" 
                    variant="destructive"
                    onClick={() => {
                      setSelectedImageUrl("");
                      form.setValue("image", "");
                    }}
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                type="button"
                variant="outline" 
                className="h-44 border-dashed flex flex-col gap-2 items-center justify-center"
                onClick={handleOpenMediaSelector}
              >
                <span className="material-icons">add_photo_alternate</span>
                <span>Выбрать изображение</span>
              </Button>
            )}
          </div>
        </div>
        
        <div className="pt-4 flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              form.reset(); 
              onSuccess && onSuccess();
            }}
          >
            Отмена
          </Button>
          <Button 
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? "Сохранение..." : "Создание..."}
              </>
            ) : (
              isEdit ? "Сохранить изменения" : "Создать курс"
            )}
          </Button>
        </div>
      </form>
      
      {/* Селектор медиа */}
      <MediaSelector
        isOpen={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={handleSelectMedia}
        mediaTypeFilter="image"
        title="Выберите изображение для курса"
      />
    </Form>
  );
}