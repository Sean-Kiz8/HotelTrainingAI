import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CourseSettings } from "./smart-course-creator";
import { X } from "lucide-react";

interface Step2CourseSettingsProps {
  settings: CourseSettings;
  onSettingsChange: (settings: Partial<CourseSettings>) => void;
}

const audienceOptions = [
  { id: "administrators", label: "Администраторы" },
  { id: "receptionists", label: "Администраторы ресепшн" },
  { id: "housekeeping", label: "Горничные" },
  { id: "security", label: "Служба безопасности" },
  { id: "kitchen", label: "Кухонный персонал" },
  { id: "waiters", label: "Официанты" },
  { id: "bartenders", label: "Бармены" },
  { id: "concierge", label: "Консьержи" },
  { id: "maintenance", label: "Технический персонал" },
];

const formatOptions = [
  { id: "text", label: "Текст" },
  { id: "video", label: "Видео" },
  { id: "interactive", label: "Интерактив" },
];

// Схема валидации формы
const formSchema = z.object({
  title: z.string()
    .min(5, { message: "Название должно содержать не менее 5 символов" })
    .max(100, { message: "Название должно содержать не более 100 символов" }),
  description: z.string()
    .min(20, { message: "Описание должно содержать не менее 20 символов" })
    .max(500, { message: "Описание должно содержать не более 500 символов" }),
  targetAudience: z.array(z.string()).min(1, { message: "Выберите хотя бы одну целевую аудиторию" }),
  difficultyLevel: z.enum(["beginner", "intermediate", "advanced"], {
    required_error: "Пожалуйста, выберите уровень сложности",
  }),
  format: z.array(z.enum(["text", "video", "interactive"])).min(1, { 
    message: "Выберите хотя бы один формат" 
  }),
  estimatedDuration: z.number().min(15).max(480),
  includeTests: z.boolean().default(true),
  includeQuizzes: z.boolean().default(true),
  includeSimulations: z.boolean().default(false),
  modulesCount: z.number().min(1).max(10),
});

export function Step2CourseSettings({ settings, onSettingsChange }: Step2CourseSettingsProps) {
  const [audience, setAudience] = useState<string[]>(settings.targetAudience || []);
  const [formats, setFormats] = useState<string[]>(settings.format || []);
  const [loading, setLoading] = useState(false);
  
  // Инициализация формы с текущими настройками
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: settings.title || "",
      description: settings.description || "",
      targetAudience: settings.targetAudience || [],
      difficultyLevel: settings.difficultyLevel || "intermediate",
      format: settings.format || ["text"],
      estimatedDuration: settings.estimatedDuration || 60,
      includeTests: settings.includeTests || true,
      includeQuizzes: settings.includeQuizzes || true,
      includeSimulations: settings.includeSimulations || false,
      modulesCount: settings.modulesCount || 3,
    },
  });

  // Обработчик отправки формы
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onSettingsChange(values);
  };

  // Вспомогательная функция для форматирования времени
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} минут`;
    } else if (mins === 0) {
      return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}`;
    } else {
      return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'} ${mins} минут`;
    }
  };

  // Обработчик изменения целевой аудитории
  const handleAudienceChange = (checked: boolean, value: string) => {
    let newAudience: string[];
    
    if (checked) {
      newAudience = [...audience, value];
    } else {
      newAudience = audience.filter(item => item !== value);
    }
    
    setAudience(newAudience);
    form.setValue("targetAudience", newAudience, { shouldValidate: true });
    onSettingsChange({ targetAudience: newAudience });
  };

  // Обработчик удаления элемента целевой аудитории
  const handleRemoveAudience = (value: string) => {
    const newAudience = audience.filter(item => item !== value);
    setAudience(newAudience);
    form.setValue("targetAudience", newAudience, { shouldValidate: true });
    onSettingsChange({ targetAudience: newAudience });
  };

  // Обработчик изменения формата курса
  const handleFormatChange = (checked: boolean, value: string) => {
    let newFormats: string[];
    
    if (checked) {
      newFormats = [...formats, value];
    } else {
      newFormats = formats.filter(item => item !== value);
    }
    
    setFormats(newFormats);
    form.setValue("format", newFormats as ("text" | "video" | "interactive")[], { shouldValidate: true });
    onSettingsChange({ format: newFormats as ("text" | "video" | "interactive")[] });
  };

  // Обработчик удаления формата
  const handleRemoveFormat = (value: string) => {
    const newFormats = formats.filter(item => item !== value);
    setFormats(newFormats);
    form.setValue("format", newFormats as ("text" | "video" | "interactive")[], { shouldValidate: true });
    onSettingsChange({ format: newFormats as ("text" | "video" | "interactive")[] });
  };

  // Обработчик изменения поля формы
  const handleFieldChange = (field: keyof CourseSettings, value: any) => {
    form.setValue(field, value, { shouldValidate: true });
    onSettingsChange({ [field]: value });
  };

  // Генерация описания через AI
  const handleGenerateDescription = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/generate-course-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.getValues("title"),
          targetAudience: form.getValues("targetAudience"),
          difficultyLevel: form.getValues("difficultyLevel"),
          format: form.getValues("format"),
          modulesCount: form.getValues("modulesCount"),
        }),
      });
      if (!response.ok) throw new Error("Ошибка генерации описания");
      const data = await response.json();
      form.setValue("description", data.description, { shouldValidate: true });
      onSettingsChange({ description: data.description });
    } catch (e) {
      // Можно добавить обработку ошибок
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Название курса */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Название курса</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Введите название курса"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleFieldChange("title", e.target.value);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Краткое и информативное название курса
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Описание курса */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Описание курса</FormLabel>
                <div className="flex gap-2 items-start">
                  <FormControl>
                    <Textarea
                      placeholder="Введите описание курса"
                      className="min-h-[120px]"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange("description", e.target.value);
                      }}
                    />
                  </FormControl>
                  <button
                    type="button"
                    className="btn btn-secondary h-10 px-4 mt-1"
                    onClick={handleGenerateDescription}
                    disabled={loading}
                  >
                    {loading ? "Генерируем..." : "Сгенерировать описание"}
                  </button>
                </div>
                <FormDescription>
                  Подробное описание курса, его целей и ожидаемых результатов
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Целевая аудитория */}
          <FormField
            control={form.control}
            name="targetAudience"
            render={() => (
              <FormItem>
                <FormLabel>Целевая аудитория</FormLabel>
                <div className="space-y-3">
                  {audienceOptions.map((option) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <Checkbox
                        id={option.id}
                        checked={audience.includes(option.id)}
                        onCheckedChange={(checked) => 
                          handleAudienceChange(checked as boolean, option.id)
                        }
                      />
                      <label
                        htmlFor={option.id}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {audience.map((value) => {
                    const option = audienceOptions.find(opt => opt.id === value);
                    return option ? (
                      <Badge key={value} variant="secondary" className="group">
                        {option.label}
                        <button
                          type="button"
                          className="ml-1 group-hover:text-destructive"
                          onClick={() => handleRemoveAudience(value)}
                        >
                          <X size={14} />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
                <FormDescription>
                  Выберите категории сотрудников, для которых предназначен курс
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Уровень сложности */}
          <FormField
            control={form.control}
            name="difficultyLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Уровень сложности</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleFieldChange("difficultyLevel", value as "beginner" | "intermediate" | "advanced");
                    }}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="beginner" id="beginner" />
                      <label htmlFor="beginner" className="text-sm">Начальный</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="intermediate" id="intermediate" />
                      <label htmlFor="intermediate" className="text-sm">Средний</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="advanced" id="advanced" />
                      <label htmlFor="advanced" className="text-sm">Продвинутый</label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormDescription>
                  Определите сложность материала в курсе
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Формат курса */}
          <FormField
            control={form.control}
            name="format"
            render={() => (
              <FormItem>
                <FormLabel>Формат курса</FormLabel>
                <div className="space-y-3">
                  {formatOptions.map((option) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`format-${option.id}`}
                        checked={formats.includes(option.id)}
                        onCheckedChange={(checked) => 
                          handleFormatChange(checked as boolean, option.id)
                        }
                      />
                      <label
                        htmlFor={`format-${option.id}`}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formats.map((value) => {
                    const option = formatOptions.find(opt => opt.id === value);
                    return option ? (
                      <Badge key={value} variant="secondary" className="group">
                        {option.label}
                        <button
                          type="button"
                          className="ml-1 group-hover:text-destructive"
                          onClick={() => handleRemoveFormat(value)}
                        >
                          <X size={14} />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
                <FormDescription>
                  Выберите форматы представления материалов
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Продолжительность курса */}
          <FormField
            control={form.control}
            name="estimatedDuration"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Ожидаемая продолжительность</FormLabel>
                <div className="space-y-2">
                  <Slider
                    value={[field.value]}
                    min={15}
                    max={480}
                    step={15}
                    onValueChange={(value) => {
                      field.onChange(value[0]);
                      handleFieldChange("estimatedDuration", value[0]);
                    }}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">15 минут</span>
                    <span className="text-sm font-medium">{formatDuration(field.value)}</span>
                    <span className="text-xs text-muted-foreground">8 часов</span>
                  </div>
                </div>
                <FormDescription>
                  Установите примерное время на прохождение всего курса
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Количество модулей */}
          <FormField
            control={form.control}
            name="modulesCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Количество модулей</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={(value) => {
                      const numValue = parseInt(value);
                      field.onChange(numValue);
                      handleFieldChange("modulesCount", numValue);
                    }}
                    defaultValue={field.value.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите количество модулей" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'модуль' : num < 5 ? 'модуля' : 'модулей'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>
                  Укажите на сколько модулей разделить курс
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Дополнительные опции */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="includeTests"
              render={({ field }) => (
                <FormItem className="flex items-start gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        handleFieldChange("includeTests", checked as boolean);
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Включить тесты</FormLabel>
                    <FormDescription>
                      Добавить итоговое тестирование по курсу
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="includeQuizzes"
              render={({ field }) => (
                <FormItem className="flex items-start gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        handleFieldChange("includeQuizzes", checked as boolean);
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Включить опросы</FormLabel>
                    <FormDescription>
                      Добавить промежуточные опросы в уроки
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="includeSimulations"
              render={({ field }) => (
                <FormItem className="flex items-start gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        handleFieldChange("includeSimulations", checked as boolean);
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Включить моделирование ситуаций</FormLabel>
                    <FormDescription>
                      Добавить интерактивные ситуации для практики
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>
      </form>
    </Form>
  );
}