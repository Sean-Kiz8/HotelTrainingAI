import { CourseSettings, UploadedFile } from "./smart-course-creator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  File, 
  FileImage,
  BookOpen, 
  Clock, 
  Users, 
  CheckCircle,
  BarChart3,
  Puzzle,
  Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Step3CoursePreviewProps {
  files: UploadedFile[];
  settings: CourseSettings;
  isGenerating: boolean;
  onGenerateCourse: () => void;
}

export function Step3CoursePreview({ 
  files, 
  settings, 
  isGenerating,
  onGenerateCourse 
}: Step3CoursePreviewProps) {
  // Получаем подходящую иконку для формата курса
  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'text': return <FileText className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'interactive': return <Puzzle className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  // Получаем текстовое представление уровня сложности
  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case 'beginner': return "Начальный";
      case 'intermediate': return "Средний";
      case 'advanced': return "Продвинутый";
      default: return "Не указан";
    }
  };

  // Получаем текстовое представление продолжительности
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

  // Получаем название аудитории по ID
  const getAudienceName = (audienceId: string) => {
    const audienceMap: Record<string, string> = {
      "administrators": "Администраторы",
      "receptionists": "Администраторы ресепшн",
      "housekeeping": "Горничные",
      "security": "Служба безопасности",
      "kitchen": "Кухонный персонал",
      "waiters": "Официанты",
      "bartenders": "Бармены",
      "concierge": "Консьержи",
      "maintenance": "Технический персонал"
    };
    
    return audienceMap[audienceId] || audienceId;
  };

  // Получаем название формата
  const getFormatName = (formatId: string) => {
    const formatMap: Record<string, string> = {
      "text": "Текст",
      "video": "Видео",
      "interactive": "Интерактив"
    };
    
    return formatMap[formatId] || formatId;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6 md:col-span-2">
          {/* Предпросмотр курса */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Предпросмотр курса</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <h3 className="text-lg font-semibold">{settings.title || "Название курса не указано"}</h3>
              <p className="text-muted-foreground">{settings.description || "Описание курса не указано"}</p>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Модули</p>
                    <p className="text-sm text-muted-foreground">{settings.modulesCount} {
                      settings.modulesCount === 1 
                        ? 'модуль' 
                        : settings.modulesCount < 5 ? 'модуля' : 'модулей'
                    }</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Продолжительность</p>
                    <p className="text-sm text-muted-foreground">{formatDuration(settings.estimatedDuration)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Сложность</p>
                    <p className="text-sm text-muted-foreground">{getDifficultyLabel(settings.difficultyLevel)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Для кого</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {settings.targetAudience && settings.targetAudience.length > 0 
                        ? getAudienceName(settings.targetAudience[0]) + (settings.targetAudience.length > 1 ? ` +${settings.targetAudience.length - 1}` : '') 
                        : "Не указано"}
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator className="my-3" />
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">Форматы</p>
                  <div className="flex flex-wrap gap-2">
                    {settings.format && settings.format.map(format => (
                      <Badge key={format} variant="secondary" className="flex items-center gap-1">
                        {getFormatIcon(format)}
                        {getFormatName(format)}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Дополнительно</p>
                  <div className="flex flex-wrap gap-2">
                    {settings.includeTests && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Тесты
                      </Badge>
                    )}
                    {settings.includeQuizzes && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Опросы
                      </Badge>
                    )}
                    {settings.includeSimulations && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Моделирование ситуаций
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Примерная структура */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Примерная структура курса</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: Math.min(3, settings.modulesCount) }).map((_, moduleIndex) => (
                <div key={moduleIndex} className="space-y-2">
                  <h4 className="font-medium flex items-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs mr-2">
                      {moduleIndex + 1}
                    </span>
                    Модуль {moduleIndex + 1}
                  </h4>
                  <div className="pl-8 space-y-2">
                    {Array.from({ length: 3 }).map((_, lessonIndex) => (
                      <div key={lessonIndex} className="flex items-center gap-2 text-sm">
                        <span className="inline-block w-4 h-4 rounded-full bg-muted text-muted-foreground text-[10px] flex items-center justify-center">
                          {lessonIndex + 1}
                        </span>
                        <span>Урок {lessonIndex + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {settings.modulesCount > 3 && (
                <p className="text-sm text-muted-foreground italic text-center">
                  ...и еще {settings.modulesCount - 3} {
                    settings.modulesCount - 3 === 1 
                      ? 'модуль' 
                      : (settings.modulesCount - 3) < 5 ? 'модуля' : 'модулей'
                  }
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Правая колонка */}
        <div className="space-y-6">
          {/* Загруженные материалы */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Загруженные материалы</CardTitle>
            </CardHeader>
            <CardContent>
              {files.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center p-2 border rounded-md">
                      <div className="mr-2">
                        {file.type.includes('image') ? (
                          <FileImage className="h-5 w-5 text-blue-500" />
                        ) : (
                          <FileText className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="truncate flex-1">
                        <p className="text-sm font-medium truncate" title={file.name}>
                          {file.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Нет загруженных материалов. Вернитесь к шагу 1, чтобы загрузить файлы.
                </p>
              )}
            </CardContent>
          </Card>
          
          {/* Готовность */}
          <Alert className={files.length === 0 ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}>
            <AlertTitle className={files.length === 0 ? "text-amber-800" : "text-emerald-800"}>
              {files.length === 0 ? "Внимание" : "Готово к генерации"}
            </AlertTitle>
            <AlertDescription className={files.length === 0 ? "text-amber-700" : "text-emerald-700"}>
              {files.length === 0 
                ? "Рекомендуется загрузить хотя бы один файл для автоматического анализа содержимого."
                : "Все настройки заданы. Нажмите кнопку 'Создать курс', чтобы начать генерацию."
              }
            </AlertDescription>
          </Alert>
          
          {/* Кнопка создания */}
          <Button 
            className="w-full" 
            size="lg"
            onClick={onGenerateCourse}
            disabled={isGenerating || (!settings.title || !settings.description)}
          >
            {isGenerating ? "Генерация курса..." : "Создать курс"}
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Процесс генерации может занять до нескольких минут в зависимости от 
            сложности курса и объема загруженных материалов. Пожалуйста, дождитесь завершения обработки.
          </p>
        </div>
      </div>
    </div>
  );
}