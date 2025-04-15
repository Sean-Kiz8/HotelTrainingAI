import { useState } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("login");

  // Редирект на главную страницу, если пользователь уже авторизован
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Форма авторизации */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center mb-2">
              <span className="material-icons text-primary mr-2 text-3xl">hotel</span>
              <CardTitle className="text-2xl font-bold text-primary">HotelLearn</CardTitle>
            </div>
            <CardDescription>
              Система обучения персонала отеля
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Вход</TabsTrigger>
                <TabsTrigger value="register">Регистрация</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <LoginForm />
              </TabsContent>
              <TabsContent value="register">
                <RegisterForm onComplete={() => setActiveTab("login")} />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              <p>© 2025 HotelLearn. Все права защищены.</p>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Баннер с описанием */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-primary/80 to-primary p-8 hidden md:flex md:flex-col md:justify-center text-white">
        <div className="max-w-xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Добро пожаловать в HotelLearn</h1>
          <p className="text-xl mb-8">
            Инновационная платформа для обучения и развития персонала отеля
          </p>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <span className="material-icons text-white">school</span>
              <div>
                <h3 className="font-medium">Интерактивные курсы</h3>
                <p className="text-white/80">Обучение с использованием современных методик</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="material-icons text-white">leaderboard</span>
              <div>
                <h3 className="font-medium">Система геймификации</h3>
                <p className="text-white/80">Повышение мотивации через достижения и рейтинги</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="material-icons text-white">analytics</span>
              <div>
                <h3 className="font-medium">Аналитика и отчеты</h3>
                <p className="text-white/80">Детальная статистика прогресса обучения</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const { loginMutation } = useAuth();
  const [formData, setFormData] = useState({
    username: "admin",
    password: "admin123"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Имя пользователя</Label>
        <Input
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
          disabled={loginMutation.isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={loginMutation.isPending}
        />
      </div>
      <Button 
        type="submit" 
        className="w-full" 
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Вход...
          </>
        ) : (
          "Войти"
        )}
      </Button>
    </form>
  );
}

function RegisterForm({ onComplete }: { onComplete: () => void }) {
  const { registerMutation } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    department: "reception",
    position: "staff",
    role: "staff"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData, {
      onSuccess: () => {
        onComplete();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Полное имя</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          disabled={registerMutation.isPending}
        />
      </div>
      <div className="grid gap-4 grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="username">Имя пользователя</Label>
          <Input
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={registerMutation.isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={registerMutation.isPending}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={registerMutation.isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="department">Отдел</Label>
        <Input
          id="department"
          name="department"
          value={formData.department}
          onChange={handleChange}
          required
          disabled={registerMutation.isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="position">Должность</Label>
        <Input
          id="position"
          name="position"
          value={formData.position}
          onChange={handleChange}
          required
          disabled={registerMutation.isPending}
        />
      </div>
      <Button 
        type="submit" 
        className="w-full" 
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Регистрация...
          </>
        ) : (
          "Зарегистрироваться"
        )}
      </Button>
    </form>
  );
}