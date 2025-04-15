import { useLocation } from "wouter";
import { LogOut, HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useChatbot } from "@/context/chatbot-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OnboardingButton } from "@/components/onboarding/onboarding-button";

const adminNavItems = [
  { label: "Дашборд", icon: "dashboard", href: "/" },
  { label: "Курсы", icon: "school", href: "/courses" },
  { label: "Сотрудники", icon: "groups", href: "/employees" },
  { label: "Медиатека", icon: "collections", href: "/media" },
  { label: "Аналитика", icon: "insert_chart", href: "/analytics" },
  { label: "Геймификация", icon: "emoji_events", href: "/achievements" },
  { label: "Настройки", icon: "settings", href: "/settings" },
];

const staffNavItems = [
  { label: "Мое обучение", icon: "menu_book", href: "/my-learning" },
  { label: "Достижения", icon: "stars", href: "/achievements" },
  { label: "Рейтинг", icon: "leaderboard", href: "/leaderboard" },
  { label: "Награды", icon: "workspace_premium", href: "/rewards" },
  { label: "Обсуждения", icon: "forum", href: "/discussions" },
];

export function Sidebar() {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { openChatbot } = useChatbot();
  
  // Всегда отображаем боковое меню для разработки
  // if (!user) return null;
  
  const goToPage = (href: string) => {
    navigate(href);
  };
  
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-neutral-200 bg-white">
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-4 mb-5">
          <span className="material-icons text-primary mr-2">hotel</span>
          <h1 className="font-sans font-bold text-xl text-primary">HotelLearn</h1>
        </div>
        
        {/* User info */}
        <div className="flex-shrink-0 px-4 pb-3 border-b border-neutral-200">
          <div className="flex items-center">
            <Avatar className="w-10 h-10 mr-3">
              <AvatarImage src={user?.avatar || ""} alt={user?.name || "Пользователь"} />
              <AvatarFallback>{user?.name?.charAt(0) || "П"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.name || "Пользователь"}</p>
              <p className="text-xs text-neutral-500">{user?.role === "admin" ? "Тренинг-менеджер" : user?.position || "Сотрудник"}</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="mt-5 flex-1 flex flex-col">
          <p className="text-xs uppercase text-neutral-500 font-semibold tracking-wider px-4 mb-2">
            Тренинг-менеджер
          </p>
          <nav className="flex-1 px-2 space-y-1">
            {adminNavItems.map((item) => (
              <div 
                key={item.href}
                role="button"
                tabIndex={0}
                onClick={() => goToPage(item.href)}
                onKeyDown={(e) => e.key === 'Enter' && goToPage(item.href)}
                className={cn(
                  "flex items-center px-2 py-2 rounded-md group transition-colors cursor-pointer",
                  location === item.href 
                    ? "bg-primary text-white" 
                    : "text-neutral-700 hover:bg-neutral-100"
                )}
              >
                <span className={cn(
                  "material-icons mr-3 text-lg",
                  location === item.href ? "text-white" : "text-neutral-500 group-hover:text-neutral-700"
                )}>
                  {item.icon}
                </span>
                {item.label}
              </div>
            ))}
          </nav>
          
          <p className="text-xs uppercase text-neutral-500 font-semibold tracking-wider px-4 mb-2 mt-6">
            Персонал
          </p>
          <nav className="flex-1 px-2 space-y-1">
            {staffNavItems.map((item) => (
              <div 
                key={item.href}
                role="button"
                tabIndex={0}
                onClick={() => goToPage(item.href)}
                onKeyDown={(e) => e.key === 'Enter' && goToPage(item.href)}
                className={cn(
                  "flex items-center px-2 py-2 rounded-md group transition-colors cursor-pointer",
                  location === item.href 
                    ? "bg-primary text-white" 
                    : "text-neutral-700 hover:bg-neutral-100"
                )}
              >
                <span className={cn(
                  "material-icons mr-3 text-lg",
                  location === item.href ? "text-white" : "text-neutral-500 group-hover:text-neutral-700"
                )}>
                  {item.icon}
                </span>
                {item.label}
              </div>
            ))}
          </nav>
        </div>
        
        {/* Chat, Help, and Logout buttons */}
        <div className="px-4 pt-4 pb-2 border-t border-neutral-200">
          <div className="flex mb-2">
            <Button 
              className="flex-1 flex justify-start mr-2" 
              variant="outline"
              onClick={openChatbot}
            >
              <span className="material-icons mr-3 text-primary">chat</span>
              Помощник ИИ
            </Button>
            
            <OnboardingButton className="text-primary" />
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-neutral-700" 
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {logoutMutation.isPending ? "Выход..." : "Выйти"}
          </Button>
        </div>
      </div>
    </aside>
  );
}