import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useChatbot } from "@/context/chatbot-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, MessageCircle, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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

export function MobileHeader() {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { isChatbotOpen, toggleChatbot } = useChatbot();
  const [isOpen, setIsOpen] = useState(false);
  
  // Всегда отображаем мобильный заголовок для разработки
  // if (!user) return null;
  
  const handleMenuItemClick = (href: string) => {
    setIsOpen(false);
    navigate(href);
  };
  
  const handleChatOpen = () => {
    toggleChatbot();
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
    setIsOpen(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent, href: string) => {
    if (e.key === 'Enter') {
      handleMenuItemClick(href);
    }
  };
  
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-neutral-200 flex items-center px-4 md:hidden z-10">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="p-4 border-b border-neutral-200">
                <div className="flex items-center">
                  <span className="material-icons text-primary mr-2">hotel</span>
                  <SheetTitle className="font-sans font-bold text-xl text-primary">HotelLearn</SheetTitle>
                </div>
                <p className="text-sm text-neutral-600 mt-1">Система обучения персонала</p>
              </SheetHeader>
              
              {/* User info */}
              <div className="p-4 border-b border-neutral-200">
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
              <div className="py-2 px-0">
                <p className="text-xs uppercase text-neutral-500 font-semibold tracking-wider px-4 mb-2">
                  Тренинг-менеджер
                </p>
                <nav>
                  <ul>
                    {adminNavItems.map((item) => (
                      <li key={item.href}>
                        <div 
                          role="button"
                          tabIndex={0}
                          onClick={() => handleMenuItemClick(item.href)}
                          onKeyDown={(e) => handleKeyDown(e, item.href)}
                          className={cn(
                            "flex items-center px-4 py-2 cursor-pointer",
                            location === item.href 
                              ? "text-primary font-medium bg-primary bg-opacity-10" 
                              : "text-neutral-700 hover:bg-neutral-100"
                          )}
                        >
                          <span className={cn(
                            "material-icons mr-3 text-sm",
                            location === item.href ? "text-primary" : "text-neutral-500"
                          )}>
                            {item.icon}
                          </span>
                          {item.label}
                        </div>
                      </li>
                    ))}
                  </ul>
                </nav>
                
                <p className="text-xs uppercase text-neutral-500 font-semibold tracking-wider px-4 mt-4 mb-2">
                  Персонал
                </p>
                <nav>
                  <ul>
                    {staffNavItems.map((item) => (
                      <li key={item.href}>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => handleMenuItemClick(item.href)}
                          onKeyDown={(e) => handleKeyDown(e, item.href)}
                          className={cn(
                            "flex items-center px-4 py-2 cursor-pointer",
                            location === item.href 
                              ? "text-primary font-medium bg-primary bg-opacity-10" 
                              : "text-neutral-700 hover:bg-neutral-100"
                          )}
                        >
                          <span className={cn(
                            "material-icons mr-3 text-sm",
                            location === item.href ? "text-primary" : "text-neutral-500"
                          )}>
                            {item.icon}
                          </span>
                          {item.label}
                        </div>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
              
              {/* Logout button */}
              <div className="mt-auto p-4 border-t border-neutral-200">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-neutral-700" 
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? "Выход..." : "Выйти"}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          
          <div className="flex items-center">
            <span className="material-icons text-primary mr-2">hotel</span>
            <h1 className="font-sans font-bold text-xl text-primary">HotelLearn</h1>
          </div>
        </div>
        
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={handleChatOpen} className="mr-2">
            <MessageCircle className="h-5 w-5" />
          </Button>
          
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.avatar || ""} alt={user?.name || "Пользователь"} />
            <AvatarFallback>{user?.name?.charAt(0) || "П"}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
