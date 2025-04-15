import { Switch, Route } from "wouter";
import NotFound from "@/pages/not-found";
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
import DebugPage from "./pages/debug";
import { useAuth } from "./context/auth-context";
import { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";

function Router() {
  const { user } = useAuth();
  
  // На время разработки всегда показываем маршруты
  // if (!user) {
  //   return null;
  // }
  
  return (
    <Switch>
      {/* Admin routes */}
      <Route path="/" component={Dashboard} />
      <Route path="/courses" component={Courses} />
      <Route path="/employees" component={Employees} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/media" component={MediaLibrary} />
      <Route path="/settings" component={Settings} />
      
      {/* Staff routes */}
      <Route path="/my-learning" component={MyLearning} />
      <Route path="/achievements" component={Achievements} />
      <Route path="/discussions" component={Discussions} />
      
      {/* Debug route */}
      <Route path="/debug" component={DebugPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

export function LoginForm() {
  const { login } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
    } catch (err) {
      setError("Неверное имя пользователя или пароль");
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center mb-2">
            <span className="material-icons text-primary mr-2">hotel</span>
            <CardTitle className="text-2xl font-bold text-primary">HotelLearn</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Войдите в систему обучения персонала
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Имя пользователя
              </label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Пароль
              </label>
              <Input
                id="password" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Войти
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function App() {
  const { user } = useAuth();
  
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
  
  // Для разработки всегда переходим на главную страницу
  // if (!user) {
  //   return <LoginForm />;
  // }
  
  return (
    <MainLayout>
      <Router />
    </MainLayout>
  );
}

export default App;
