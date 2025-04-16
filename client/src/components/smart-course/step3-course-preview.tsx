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
  Video,
  RefreshCw,
  FileX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";

interface Step3CoursePreviewProps {
  files: UploadedFile[];
  settings: CourseSettings;
  isGenerating: boolean;
  onGenerateCourse: () => void;
  fetchFilesFromServer?: () => Promise<void>;
  onRemoveFile?: (fileId: string) => void;
  onGenerateContent?: () => void;
}

export function Step3CoursePreview({ 
  files, 
  settings, 
  isGenerating,
  onGenerateCourse,
  fetchFilesFromServer,
  onRemoveFile,
  onGenerateContent
}: Step3CoursePreviewProps) {
  const [error, setError] = useState<string | null>(null);

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

  // Обёртка для генерации содержания с обработкой ошибок
  const handleGenerateContentSafe = async () => {
    setError(null);
    if (!onGenerateContent) return;
    try {
      await onGenerateContent();
    } catch (e: any) {
      setError(e?.message || 'Ошибка генерации содержания');
    }
  };

  // Обёртка для генерации курса с обработкой ошибок
  const handleGenerateCourseSafe = async () => {
    setError(null);
    try {
      await onGenerateCourse();
    } catch (e: any) {
      setError(e?.message || 'Ошибка генерации курса');
    }
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
          {files.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Загруженные материалы</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium">Материалы ({files.length})</h4>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchFilesFromServer && fetchFilesFromServer()}
                    className="text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Обновить
                  </Button>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center p-2 border rounded-md group">
                      <div className="mr-2">
                        {file.type.includes('image') ? (
                          <FileImage className="h-5 w-5 text-blue-500" />
                        ) : file.type.includes('pdf') ? (
                          <FileText className="h-5 w-5 text-red-500" />
                        ) : file.type.includes('word') || file.type.includes('doc') ? (
                          <FileText className="h-5 w-5 text-blue-700" />
                        ) : file.type.includes('ppt') || file.type.includes('presentation') ? (
                          <FileText className="h-5 w-5 text-orange-500" />
                        ) : (
                          <FileText className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="truncate flex-1">
                        <p className="text-sm font-medium truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID: {file.id} • Тип: {file.type.split('/')[1] || file.type}
                        </p>
                      </div>
                      {onRemoveFile && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" 
                          title="Удалить файл"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onRemoveFile(file.id);
                          }}
                        >
                          <FileX className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Предпросмотр PDF для выбранного файла */}
                {files.some(f => f.type.includes('pdf')) && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <h4 className="text-sm font-medium mb-2">Предпросмотр PDF</h4>
                    <div className="flex flex-col gap-2">
                      {files.filter(f => f.type.includes('pdf')).map(file => (
                        <div key={`preview-${file.id}`} className="border rounded-md p-2">
                          <p className="text-sm font-medium mb-1">{file.name}</p>
                          <div className="w-full bg-muted rounded-md relative overflow-hidden" style={{ height: '150px' }}>
                            <iframe 
                              src={file.url}
                              className="absolute inset-0 w-full h-full"
                              title={`Предпросмотр ${file.name}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Загруженные материалы</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <FileX className="h-12 w-12 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Нет загруженных материалов. Вернитесь к шагу 1, чтобы загрузить файлы.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
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
          
          {/* Сообщение об ошибке */}
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col gap-3 mt-6">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleGenerateContentSafe}
              variant="secondary"
              disabled={isGenerating}
            >
              Сгенерировать содержание
            </Button>
            <p className="text-sm text-muted-foreground">
              Процесс генерации может занять до нескольких минут в зависимости от 
              сложности курса и объема загруженных материалов. Пожалуйста, дождитесь завершения обработки.
            </p>
            <Button 
              className="w-full mt-2" 
              size="lg"
              onClick={handleGenerateCourseSafe}
              disabled={isGenerating || (!settings.title || !settings.description)}
            >
              {isGenerating ? "Генерация курса..." : "Создать курс"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}