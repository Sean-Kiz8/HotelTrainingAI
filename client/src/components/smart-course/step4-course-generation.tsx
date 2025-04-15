import { GeneratedCourse } from "./smart-course-creator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, ChevronRight, FileText, Clock, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

interface Step4CourseGenerationProps {
  generatedCourse: GeneratedCourse | null;
}

export function Step4CourseGeneration({ generatedCourse }: Step4CourseGenerationProps) {
  const [, setLocation] = useLocation();
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  
  // Если курс еще не был сгенерирован, показываем сообщение об ожидании
  if (!generatedCourse) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-pulse text-primary text-6xl">
            <Clock />
          </div>
          <h3 className="text-xl font-semibold">Ожидание генерации курса</h3>
          <p className="text-muted-foreground max-w-md">
            Пожалуйста, завершите предыдущие шаги и нажмите кнопку "Создать курс" для генерации нового учебного курса
          </p>
        </div>
      </div>
    );
  }

  // Переключатель состояния раскрытия модуля
  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };
  
  // Подсчет общего времени прохождения курса
  const getTotalDuration = () => {
    let totalMinutes = 0;
    
    generatedCourse.modules.forEach(module => {
      module.lessons.forEach(lesson => {
        // Преобразуем duration в число, учитывая, что оно может быть строкой или числом
        let durationMinutes = 0;
        if (typeof lesson.duration === 'number') {
          durationMinutes = lesson.duration;
        } else if (typeof lesson.duration === 'string') {
          // Пытаемся извлечь число из строки (например, "10 мин.")
          const match = lesson.duration.match(/\d+/);
          if (match) {
            durationMinutes = parseInt(match[0], 10);
          }
        }
        
        // Проверяем на корректность значения (избегаем NaN, бесконечности, отрицательных значений)
        if (isFinite(durationMinutes) && durationMinutes >= 0) {
          totalMinutes += durationMinutes;
        }
      });
    });
    
    // Проверка на корректность значения totalMinutes
    if (!isFinite(totalMinutes) || totalMinutes < 0) {
      return "Время не определено";
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    
    if (hours === 0) {
      return `${minutes} минут`;
    } else if (minutes === 0) {
      return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}`;
    } else {
      return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'} ${minutes} минут`;
    }
  };
  
  // Подсчет общего количества уроков
  const getTotalLessonsCount = () => {
    let totalLessons = 0;
    
    generatedCourse.modules.forEach(module => {
      totalLessons += module.lessons.length;
    });
    
    return totalLessons;
  };
  
  // Подсчет количества модулей с тестами
  const getQuizzesCount = () => {
    let quizzesCount = 0;
    
    generatedCourse.modules.forEach(module => {
      module.lessons.forEach(lesson => {
        if (lesson.hasQuiz) {
          quizzesCount++;
        }
      });
    });
    
    return quizzesCount;
  };
  
  // Переход к странице курса
  const goToCourse = () => {
    setLocation(`/course-details/${generatedCourse.id}`);
  };
  
  // Создание нового курса (перезапуск процесса)
  const createNewCourse = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Курс успешно создан</AlertTitle>
        <AlertDescription className="text-green-700">
          Курс "{generatedCourse.title}" был успешно сгенерирован и добавлен в систему
        </AlertDescription>
      </Alert>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{generatedCourse.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{generatedCourse.description}</p>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="flex flex-col items-center border rounded-lg p-3 text-center">
                  <span className="text-2xl font-semibold text-primary">{generatedCourse.modules.length}</span>
                  <span className="text-sm text-muted-foreground">
                    {generatedCourse.modules.length === 1 ? "Модуль" : 
                     generatedCourse.modules.length < 5 ? "Модуля" : "Модулей"}
                  </span>
                </div>
                
                <div className="flex flex-col items-center border rounded-lg p-3 text-center">
                  <span className="text-2xl font-semibold text-primary">{getTotalLessonsCount()}</span>
                  <span className="text-sm text-muted-foreground">
                    {getTotalLessonsCount() === 1 ? "Урок" : 
                     getTotalLessonsCount() < 5 ? "Урока" : "Уроков"}
                  </span>
                </div>
                
                <div className="flex flex-col items-center border rounded-lg p-3 text-center">
                  <span className="text-2xl font-semibold text-primary">{getTotalDuration()}</span>
                  <span className="text-sm text-muted-foreground">Общая длительность</span>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <h3 className="text-lg font-semibold mb-4">Содержание курса</h3>
              
              <div className="space-y-4">
                {generatedCourse.modules.map((module, moduleIndex) => (
                  <Card key={module.id} className="overflow-hidden">
                    <div 
                      className="flex items-center p-4 cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                      onClick={() => toggleModule(module.id)}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3">
                        {moduleIndex + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{module.title}</h4>
                        <p className="text-sm text-muted-foreground">{module.lessons.length} {
                          module.lessons.length === 1 ? 'урок' : module.lessons.length < 5 ? 'урока' : 'уроков'
                        }</p>
                      </div>
                      <ChevronRight 
                        className={`h-5 w-5 text-muted-foreground transition-transform ${
                          expandedModules[module.id] ? 'rotate-90' : ''
                        }`} 
                      />
                    </div>
                    
                    {expandedModules[module.id] && (
                      <div className="p-4 pt-0">
                        <Separator className="my-3" />
                        <div className="space-y-3 pl-8 pt-2">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <div key={lesson.id} className="flex items-start">
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs mr-3 mt-0.5">
                                {lessonIndex + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <h5 className="font-medium">{lesson.title}</h5>
                                  <div className="flex items-center gap-2 ml-2">
                                    {lesson.hasQuiz && (
                                      <Badge variant="outline" className="ml-auto">
                                        Тест
                                      </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                      {lesson.duration} мин
                                    </span>
                                  </div>
                                </div>
                                <div className="text-sm mt-1 text-muted-foreground line-clamp-2">
                                  {lesson.content ? (
                                    <span>{lesson.content.slice(0, 150)}...</span>
                                  ) : (
                                    <span className="italic">Содержимое урока будет доступно при просмотре</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Информация о курсе</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">ID курса</p>
                <p className="text-sm text-muted-foreground">{generatedCourse.id}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Общая продолжительность</p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{getTotalDuration()}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Тесты и проверка знаний</p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{getQuizzesCount()} {
                    getQuizzesCount() === 1 ? 'тест' : getQuizzesCount() < 5 ? 'теста' : 'тестов'
                  }</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Что дальше?</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Ваш курс готов к использованию</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Вы можете отредактировать его структуру и содержание</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Назначьте курс сотрудникам для обучения</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-3">
            <Button className="w-full" onClick={goToCourse}>
              Перейти к курсу
            </Button>
            
            <Button variant="outline" className="w-full" onClick={createNewCourse}>
              Создать новый курс
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}