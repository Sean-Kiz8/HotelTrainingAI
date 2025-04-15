import { GeneratedCourse } from "./smart-course-creator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Clock, FileText, LayoutList, Timer } from "lucide-react";
import { useLocation } from "wouter";

interface Step4CourseGenerationProps {
  generatedCourse: GeneratedCourse | null;
}

export function Step4CourseGeneration({ generatedCourse }: Step4CourseGenerationProps) {
  const [, setLocation] = useLocation();

  const handleViewCourse = () => {
    if (generatedCourse?.id) {
      setLocation(`/course-details/${generatedCourse.id}`);
    }
  };

  const handleEditCourse = () => {
    if (generatedCourse?.id) {
      setLocation(`/create-course?id=${generatedCourse.id}`);
    }
  };

  if (!generatedCourse) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-primary mb-4">
          <LayoutList className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium">Генерация курса...</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Пожалуйста, подождите. Мы создаем структуру курса на основе ваших материалов.
        </p>
      </div>
    );
  }

  // Расчет общей длительности курса
  const totalDuration = generatedCourse.modules.reduce(
    (total, module) =>
      total +
      module.lessons.reduce((lessonTotal, lesson) => lessonTotal + lesson.duration, 0),
    0
  );

  // Расчет общего количества уроков
  const totalLessons = generatedCourse.modules.reduce(
    (total, module) => total + module.lessons.length,
    0
  );

  // Расчет количества тестов
  const totalQuizzes = generatedCourse.modules.reduce(
    (total, module) =>
      total + module.lessons.filter((lesson) => lesson.hasQuiz).length,
    0
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-green-500 mb-4">
          <Check className="h-12 w-12 mx-auto" />
        </div>
        <h2 className="text-xl font-bold">Курс успешно создан!</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Ваш новый курс был сгенерирован и готов к использованию
        </p>
      </div>

      <Card>
        <CardHeader className="bg-primary/5">
          <CardTitle>{generatedCourse.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground mb-4">
            {generatedCourse.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Общая длительность</p>
                <p className="font-medium">{totalDuration} минут</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LayoutList className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Количество модулей</p>
                <p className="font-medium">{generatedCourse.modules.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Всего уроков</p>
                <p className="font-medium">{totalLessons}</p>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <h3 className="font-medium mb-4">Структура курса</h3>

          <Accordion type="single" collapsible className="w-full">
            {generatedCourse.modules.map((module) => (
              <AccordionItem key={module.id} value={`module-${module.id}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">{module.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {module.lessons.length} уроков
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pl-2">
                    {module.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {module.description}
                      </p>
                    )}
                    
                    {module.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="border rounded-md p-3 bg-white shadow-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-sm">{lesson.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {lesson.content.substring(0, 100)}...
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              <span>{lesson.duration} мин</span>
                            </Badge>
                            {lesson.hasQuiz && (
                              <Badge variant="outline" className="bg-blue-50">
                                Тест
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <Separator className="my-6" />

          <div className="flex flex-wrap gap-3 justify-end">
            <Button variant="outline" onClick={handleEditCourse}>
              Редактировать курс
            </Button>
            <Button onClick={handleViewCourse}>
              Перейти к курсу
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}