import { CourseSettings, UploadedFile } from "./smart-course-creator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  FileImage,
  Film,
  BookOpen,
  Users,
  BarChart3,
  CheckCircle,
  Clock,
  BookType,
  List
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
  
  const formatIcons: Record<string, React.ReactNode> = {
    text: <FileText className="h-4 w-4" />,
    video: <Film className="h-4 w-4" />,
    interactive: <Users className="h-4 w-4" />
  };
  
  const getFormatLabel = (format: string) => {
    const labels: Record<string, string> = {
      text: 'Текстовые материалы',
      video: 'Видеоматериалы',
      interactive: 'Интерактивные задания'
    };
    return labels[format] || format;
  };
  
  const getDifficultyLabel = (difficulty: string) => {
    const labels: Record<string, string> = {
      beginner: 'Начальный',
      intermediate: 'Средний',
      advanced: 'Продвинутый'
    };
    return labels[difficulty] || difficulty;
  };
  
  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-100 text-green-700',
      intermediate: 'bg-blue-100 text-blue-700',
      advanced: 'bg-purple-100 text-purple-700'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-700';
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Предпросмотр курса</h2>
        <p className="text-sm text-muted-foreground">
          Проверьте настройки курса перед его генерацией
        </p>
      </div>
      
      <Card>
        <CardHeader className="bg-primary/5 pb-3">
          <CardTitle className="flex justify-between items-start">
            <div>
              <span className="text-lg">{settings.title || 'Название курса не указано'}</span>
              <Badge
                className={`ml-2 ${getDifficultyColor(settings.difficultyLevel)}`}
                variant="outline"
              >
                {getDifficultyLabel(settings.difficultyLevel)}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>Описание курса:</span>
              </div>
              <p className="text-sm">
                {settings.description || 'Описание курса не указано'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Длительность:</span>
                </div>
                <p className="text-sm font-medium">{settings.estimatedDuration} минут</p>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookType className="h-4 w-4" />
                  <span>Количество модулей:</span>
                </div>
                <p className="text-sm font-medium">{settings.modulesCount}</p>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <List className="h-4 w-4" />
                  <span>Ориентировочное количество уроков:</span>
                </div>
                <p className="text-sm font-medium">{settings.modulesCount * 3}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Целевая аудитория:</span>
              </div>
              {settings.targetAudience.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {settings.targetAudience.map((audience) => (
                    <Badge key={audience} variant="outline">
                      {audience}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Целевая аудитория не указана</p>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                <span>Форматы материалов:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {settings.format.map((format) => (
                  <Badge key={format} variant="outline" className="flex items-center gap-1">
                    {formatIcons[format]}
                    <span>{getFormatLabel(format)}</span>
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                <span>Дополнительные элементы:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {settings.includeTests && (
                  <Badge variant="outline">Итоговые тесты</Badge>
                )}
                {settings.includeQuizzes && (
                  <Badge variant="outline">Промежуточные опросы</Badge>
                )}
                {settings.includeSimulations && (
                  <Badge variant="outline">Симуляции рабочих ситуаций</Badge>
                )}
                {!settings.includeTests && !settings.includeQuizzes && !settings.includeSimulations && (
                  <p className="text-sm text-muted-foreground">Дополнительные элементы не выбраны</p>
                )}
              </div>
            </div>
            
            <Separator />
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Исходные файлы ({files.length}):</span>
              </div>
              {files.length > 0 ? (
                <div className="grid gap-2">
                  {files.map((file) => (
                    <div key={file.id} className="text-sm flex items-center gap-2">
                      {file.type.includes('image') ? (
                        <FileImage className="h-4 w-4 text-blue-500" />
                      ) : (
                        <FileText className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Файлы не загружены</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end mt-6">
        <Button
          onClick={onGenerateCourse}
          disabled={isGenerating || files.length === 0 || !settings.title || !settings.description}
          className="flex items-center gap-2"
        >
          {isGenerating ? 'Генерация...' : 'Создать курс'}
        </Button>
      </div>
    </div>
  );
}