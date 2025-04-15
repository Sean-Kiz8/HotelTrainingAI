import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Step1FileUpload } from "./step1-file-upload";
import { Step2CourseSettings } from "./step2-course-settings";
import { Step3CoursePreview } from "./step3-course-preview";
import { Step4CourseGeneration } from "./step4-course-generation";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  status: 'uploading' | 'completed' | 'error';
  progress?: number;
  error?: string;
  path?: string;
}

export interface CourseSettings {
  title: string;
  description: string;
  targetAudience: string[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  format: ('text' | 'video' | 'interactive')[];
  estimatedDuration: number; // в минутах
  includeTests: boolean;
  includeQuizzes: boolean;
  includeSimulations: boolean;
  modulesCount: number;
}

export interface GeneratedCourse {
  title: string;
  description: string;
  modules: {
    id: number;
    title: string;
    description: string;
    lessons: {
      id: number;
      title: string;
      content: string;
      duration: string;
      type: string;
    }[];
  }[];
}

export function SmartCourseCreator() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [courseSettings, setCourseSettings] = useState<CourseSettings>({
    title: '',
    description: '',
    targetAudience: [],
    difficultyLevel: 'intermediate',
    format: ['text'],
    estimatedDuration: 60,
    includeTests: true,
    includeQuizzes: true,
    includeSimulations: false,
    modulesCount: 3
  });
  const [generatedCourse, setGeneratedCourse] = useState<GeneratedCourse | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Функция для загрузки файлов с сервера
  const fetchFilesFromServer = async () => {
    try {
      const response = await fetch('/api/media/list');
      if (response.ok) {
        const mediaFiles = await response.json();
        console.log('Loaded media files from server:', mediaFiles);
        
        if (mediaFiles && mediaFiles.length > 0) {
          // Обновляем состояние файлов
          setFiles(mediaFiles);
        }
      }
    } catch (error) {
      console.error('Error loading media files:', error);
    }
  };
  
  // Функция для удаления файла из списка
  const handleRemoveFile = (fileId: string) => {
    // Обновляем состояние, удаляя файл с указанным id
    setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
  };
  
  // При переходе на шаг 3 (предпросмотр) загружаем файлы с сервера
  useEffect(() => {
    if (currentStep === 3) {
      fetchFilesFromServer();
    }
  }, [currentStep]);

  const steps = [
    { id: 1, name: "Загрузка материалов", component: Step1FileUpload },
    { id: 2, name: "Настройка курса", component: Step2CourseSettings },
    { id: 3, name: "Предпросмотр", component: Step3CoursePreview },
    { id: 4, name: "Генерация курса", component: Step4CourseGeneration }
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFilesChange = (newFiles: UploadedFile[]) => {
    setFiles(newFiles);
  };

  const handleSettingsChange = (settings: Partial<CourseSettings>) => {
    setCourseSettings(prev => ({ ...prev, ...settings }));
  };

  const handleGenerateCourse = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // API запрос для генерации курса
      const response = await fetch('/api/courses/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: files.map(f => f.id),
          settings: courseSettings
        }),
      });
      
      if (!response.ok) {
        throw new Error('Ошибка при генерации курса');
      }
      
      const data = await response.json();
      setGeneratedCourse(data);
      // После успешной генерации переходим на последний шаг
      setCurrentStep(4);
    } catch (err) {
      console.error('Error generating course:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="bg-primary/5">
        <CardTitle className="text-xl font-bold text-primary">SmartCourse - Умный конструктор курсов</CardTitle>
        <CardDescription>
          Загрузите материалы и получите автоматически структурированный курс для обучения персонала
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Tabs
          value={currentStep.toString()}
          onValueChange={(value) => setCurrentStep(parseInt(value))}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 mb-6">
            {steps.map((step) => (
              <TabsTrigger
                key={step.id}
                value={step.id.toString()}
                disabled={step.id > Math.min(currentStep + 1, steps.length)}
                className="flex items-center gap-2"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-xs">
                  {step.id}
                </span>
                <span className="hidden md:inline">{step.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="1">
            <Step1FileUpload 
              files={files} 
              onFilesChange={handleFilesChange} 
            />
          </TabsContent>
          
          <TabsContent value="2">
            <Step2CourseSettings 
              settings={courseSettings} 
              onSettingsChange={handleSettingsChange} 
            />
          </TabsContent>
          
          <TabsContent value="3">
            <Step3CoursePreview 
              files={files} 
              settings={courseSettings} 
              isGenerating={isGenerating}
              onGenerateCourse={handleGenerateCourse}
              fetchFilesFromServer={fetchFilesFromServer}
              onRemoveFile={handleRemoveFile}
            />
          </TabsContent>
          
          <TabsContent value="4">
            <Step4CourseGeneration 
              generatedCourse={generatedCourse} 
            />
          </TabsContent>
        </Tabs>
        
        <Separator className="my-6" />
        
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleBack} 
            disabled={currentStep === 1}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Назад
          </Button>
          
          {currentStep < 3 && (
            <Button 
              onClick={handleNext} 
              disabled={
                (currentStep === 1 && files.length === 0) || 
                (currentStep === 2 && (!courseSettings.title || !courseSettings.description))
              }
              className="flex items-center gap-1"
            >
              Далее <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          
          {currentStep === 3 && (
            <Button 
              onClick={handleGenerateCourse} 
              disabled={isGenerating}
              className="flex items-center gap-1"
            >
              {isGenerating ? 'Генерация...' : 'Создать курс'} <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}