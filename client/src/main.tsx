import { createRoot } from "react-dom/client";
import { Switch, Route } from "wouter";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./context/auth-context";
import { ChatbotProvider } from "./context/chatbot-context";
import { MainLayout } from "./components/layout/main-layout";
import Dashboard from "./pages/dashboard";
import Courses from "./pages/courses";
import Employees from "./pages/employees";
import Analytics from "./pages/analytics";
import Settings from "./pages/settings";
import MyLearning from "./pages/my-learning";
import Achievements from "./pages/achievements";
import Discussions from "./pages/discussions";
import MediaLibrary from "./pages/media-library";
import NotFound from "./pages/not-found";
import LoginForm from "./components/auth/login-form";
import { useAuth } from "./context/auth-context";

// Компонент для роутинга
function AppRoutes() {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-50">
        <LoginForm />
      </div>
    );
  }
  
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/courses" component={Courses} />
        <Route path="/employees" component={Employees} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/settings" component={Settings} />
        <Route path="/media" component={MediaLibrary} />
        <Route path="/my-learning" component={MyLearning} />
        <Route path="/achievements" component={Achievements} />
        <Route path="/discussions" component={Discussions} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

// Главная точка входа
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ChatbotProvider>
        <AppRoutes />
        <Toaster />
      </ChatbotProvider>
    </AuthProvider>
  </QueryClientProvider>
);
