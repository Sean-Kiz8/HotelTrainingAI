import { Switch, Route } from "wouter";
import NotFound from "@/pages/not-found";
import { MainLayout } from "./components/layout/main-layout";
import { TempMainLayout } from "./components/layout/temp-main-layout";
import Dashboard from "./pages/dashboard";
import Courses from "./pages/courses";
import CourseDetails from "./pages/course-details";
import CreateCourse from "./pages/create-course";
import SmartCourse from "./pages/smart-course";
import Employees from "./pages/employees";
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
import { useEffect } from "react";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { OnboardingProvider } from "./hooks/use-onboarding";
import { Onboarding } from "./components/onboarding";
import { ChatbotProvider } from "./context/chatbot-context";

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
  
  return (
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
                  <ProtectedRoute path="/employees" component={Employees} />
                  <ProtectedRoute path="/analytics" component={Analytics} />
                  <ProtectedRoute path="/media" component={MediaLibrary} />
                  <ProtectedRoute path="/settings" component={Settings} />
                  
                  {/* Staff routes */}
                  <ProtectedRoute path="/my-learning" component={MyLearning} />
                  <ProtectedRoute path="/achievements" component={Achievements} />
                  <ProtectedRoute path="/leaderboard" component={Leaderboard} />
                  <ProtectedRoute path="/rewards" component={Rewards} />
                  <ProtectedRoute path="/discussions" component={Discussions} />
                  
                  {/* Debug route */}
                  <ProtectedRoute path="/debug" component={DebugPage} />
                  
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
  );
}

export default App;
