import { Switch, Route } from "wouter";
import NotFound from "@/pages/not-found";
import { MainLayout } from "./components/layout/main-layout";
import { TempMainLayout } from "./components/layout/temp-main-layout";
import Dashboard from "./pages/dashboard";
import Courses from "./pages/courses";
import CourseDetails from "./pages/course-details";
import LessonView from "./pages/lesson-view";
import CreateCourse from "./pages/create-course";
import SmartCourse from "./pages/smart-course";
import Employees from "./pages/employees";
import EmployeeProfile from "./pages/employee-profile";
import Analytics from "./pages/analytics";
import Settings from "./pages/settings";
import MyLearning from "./pages/my-learning";
import Achievements from "./pages/achievements";
import Leaderboard from "./pages/leaderboard";
import Rewards from "./pages/rewards";
import Discussions from "./pages/discussions";
import MediaLibrary from "./pages/media-library";
import DebugPage from "./pages/debug";
import AuthPage from "./pages/auth-page";
// AI Personal Learning Path pages
import LearningPathGenerator from "./pages/learning-path-generator";
import AILearningPath from "./pages/ai-learning-path";
import LearningPaths from "./pages/learning-paths";
import LearningPathDetails from "./pages/learning-path-details";
// Assessment pages
import Assessments from "./pages/assessments";
import AssessmentSession from "./pages/assessment-session";
import AssessmentResults from "./pages/assessment-results";
import AssessmentDetails from "./pages/assessment-details";
import StorageTestPage from "./pages/storage-test";
import CacheTestPage from "./pages/cache-test";
import { useEffect } from "react";
import { ProtectedRoute } from "./lib/protected-route";
// Используем единую систему авторизации
import { AuthProvider } from "./hooks/use-auth";
import { OnboardingProvider } from "./hooks/use-onboarding";
import { Onboarding } from "./components/onboarding";
import { ChatbotProvider } from "./context/chatbot-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function App() {
  // Add the Material Icons font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Add fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Создаем экземпляр QueryClient
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        {/* Auth route - с AuthProvider */}
        <Route path="/auth">
          <AuthProvider>
            <AuthPage />
          </AuthProvider>
        </Route>

        {/* Защищенные маршруты - с TempMainLayout и AuthProvider */}
        <Route path="*">
          <AuthProvider>
            <ChatbotProvider>
              <OnboardingProvider>
                <TempMainLayout>
                  <Switch>
                    <ProtectedRoute path="/" component={Dashboard} />
                    <ProtectedRoute path="/courses" component={Courses} />
                    <ProtectedRoute path="/course-details/:id" component={CourseDetails} />
                    <ProtectedRoute path="/create-course" component={CreateCourse} />
                    <ProtectedRoute path="/smart-course" component={SmartCourse} />
                    <ProtectedRoute path="/lesson/:id" component={LessonView} />
                    <ProtectedRoute path="/employees" component={Employees} />
                    <ProtectedRoute path="/employee-profile/:id" component={EmployeeProfile} />
                    <ProtectedRoute path="/analytics" component={Analytics} />
                    <ProtectedRoute path="/media" component={MediaLibrary} />
                    <ProtectedRoute path="/settings" component={Settings} />

                    {/* Staff routes */}
                    <ProtectedRoute path="/my-learning" component={MyLearning} />
                    <ProtectedRoute path="/achievements" component={Achievements} />
                    <ProtectedRoute path="/leaderboard" component={Leaderboard} />
                    <ProtectedRoute path="/rewards" component={Rewards} />
                    <ProtectedRoute path="/discussions" component={Discussions} />

                    {/* AI Personal Learning Path routes */}
                    <ProtectedRoute path="/learning-paths" component={LearningPaths} />
                    <ProtectedRoute path="/learning-path/:id" component={LearningPathDetails} />
                    <ProtectedRoute path="/learning-path-generator" component={LearningPathGenerator} />
                    <ProtectedRoute path="/ai-learning-path" component={AILearningPath} />

                    {/* Assessment routes */}
                    <ProtectedRoute path="/assessments" component={Assessments} />
                    <ProtectedRoute path="/assessment-details/:id" component={AssessmentDetails} />
                    <ProtectedRoute path="/assessment-session/:id" component={AssessmentSession} />
                    <ProtectedRoute path="/assessment-results/:id" component={AssessmentResults} />

                    {/* Debug route */}
                    <ProtectedRoute path="/debug" component={DebugPage} />
                    
                    {/* Storage test route */}
                    <ProtectedRoute path="/storage-test" component={StorageTestPage} />
                    
                    {/* Cache test route */}
                    <ProtectedRoute path="/cache-test" component={CacheTestPage} />

                    {/* Fallback to 404 */}
                    <Route component={NotFound} />
                  </Switch>

                  {/* Онбординг компонент */}
                  <Onboarding />
                </TempMainLayout>
              </OnboardingProvider>
            </ChatbotProvider>
          </AuthProvider>
        </Route>
      </Switch>
    </QueryClientProvider>
  );
}

export default App;
