import { Layout } from "../components/layout";
import { SmartCourseCreator } from "../components/smart-course/smart-course-creator";
import { Container } from "../components/ui/container";
import { useAuth } from "../hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function SmartCoursePage() {
  const { user, isLoading } = useAuth();
  const isAuthenticated = !!user;
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Проверяем авторизацию
    if (!isAuthenticated) {
      setLocation('/auth');
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated || !user) {
    return (
      <Layout>
        <Container>
          <div className="flex items-center justify-center h-[80vh]">
            <div className="animate-pulse text-center">
              <h2 className="text-xl font-semibold">Загрузка...</h2>
              <p className="text-muted-foreground">Пожалуйста, подождите</p>
            </div>
          </div>
        </Container>
      </Layout>
    );
  }

  return (
    <div className="py-8 px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">SmartCourse - Интеллектуальный конструктор курсов</h1>
        <p className="text-muted-foreground">
          Загрузите ваши материалы, и ИИ создаст структурированный курс обучения для сотрудников отеля
        </p>
      </div>
      
      <SmartCourseCreator />
    </div>
  );
}