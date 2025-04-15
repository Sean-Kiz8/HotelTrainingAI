import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: string;
  href: string;
}

const adminNavItems: NavItem[] = [
  { label: "Дашборд", icon: "dashboard", href: "/" },
  { label: "Курсы", icon: "school", href: "/courses" },
  { label: "Сотрудники", icon: "groups", href: "/employees" },
  { label: "Аналитика", icon: "insert_chart", href: "/analytics" },
  { label: "Настройки", icon: "settings", href: "/settings" },
];

const staffNavItems: NavItem[] = [
  { label: "Мое обучение", icon: "menu_book", href: "/my-learning" },
  { label: "Достижения", icon: "stars", href: "/achievements" },
  { label: "Обсуждения", icon: "forum", href: "/discussions" },
];

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  if (!user) return null;

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 z-10">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <span className="material-icons text-primary mr-2">hotel</span>
          <h1 className="font-sans font-bold text-lg text-primary">HotelLearn</h1>
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="material-icons text-neutral-700">menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[300px] p-0">
            <div className="p-4 border-b border-neutral-200">
              <div className="flex items-center">
                <span className="material-icons text-primary mr-2">hotel</span>
                <h1 className="font-sans font-bold text-xl text-primary">HotelLearn</h1>
              </div>
              <p className="text-sm text-neutral-600 mt-1">Система обучения персонала</p>
            </div>
            
            {/* User profile */}
            <div className="p-4 border-b border-neutral-200">
              <div className="flex items-center">
                <Avatar className="w-8 h-8 mr-3">
                  <AvatarImage src={user.avatar || ""} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-neutral-500">{user.role === "admin" ? "Тренинг-менеджер" : user.position}</p>
                </div>
              </div>
            </div>
            
            {/* Admin Navigation */}
            <div className="py-2 px-4 border-b border-neutral-200">
              <p className="text-xs uppercase text-neutral-500 font-semibold tracking-wider mb-2">
                Тренинг-менеджер
              </p>
              <nav>
                <ul>
                  {adminNavItems.map((item) => (
                    <li key={item.href} className="mb-1">
                      <Link href={item.href}>
                        <a 
                          className={cn(
                            "flex items-center px-2 py-2 rounded-md",
                            location === item.href 
                              ? "text-primary font-medium bg-primary bg-opacity-10" 
                              : "text-neutral-700 hover:bg-neutral-100"
                          )}
                          onClick={() => setIsOpen(false)}
                        >
                          <span className={cn(
                            "material-icons mr-3 text-sm",
                            location === item.href ? "text-primary" : "text-neutral-500"
                          )}>
                            {item.icon}
                          </span>
                          {item.label}
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
            
            {/* Staff Navigation */}
            <div className="py-2 px-4">
              <p className="text-xs uppercase text-neutral-500 font-semibold tracking-wider mb-2">
                Персонал
              </p>
              <nav>
                <ul>
                  {staffNavItems.map((item) => (
                    <li key={item.href} className="mb-1">
                      <Link href={item.href}>
                        <a 
                          className={cn(
                            "flex items-center px-2 py-2 rounded-md",
                            location === item.href 
                              ? "text-primary font-medium bg-primary bg-opacity-10" 
                              : "text-neutral-700 hover:bg-neutral-100"
                          )}
                          onClick={() => setIsOpen(false)}
                        >
                          <span className={cn(
                            "material-icons mr-3 text-sm",
                            location === item.href ? "text-primary" : "text-neutral-500"
                          )}>
                            {item.icon}
                          </span>
                          {item.label}
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
            
            {/* Logout Button */}
            <div className="p-4 border-t border-neutral-200 mt-auto">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={logout}
              >
                <span className="material-icons mr-2 text-sm">logout</span>
                Выйти
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
