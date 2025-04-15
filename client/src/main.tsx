import { createRoot } from "react-dom/client";
import { Switch, Route } from "wouter";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./context/auth-context";
import { ChatbotProvider } from "./context/chatbot-context";
import { ChatbotButton } from "./components/chatbot/chatbot-button";
import Mockup from "./mockup";
import AllCourses from "./pages/all-courses";
import CourseDetails from "./pages/course-details";
import Analytics from "./pages/analytics";

// Простая маршрутизация
function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Mockup} />
      <Route path="/courses" component={AllCourses} />
      <Route path="/course/:id" component={CourseDetails} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/:rest*">
        {() => <Mockup />}
      </Route>
    </Switch>
  );
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ChatbotProvider>
        <AppRoutes />
        <ChatbotButton />
        <Toaster />
      </ChatbotProvider>
    </AuthProvider>
  </QueryClientProvider>
);
