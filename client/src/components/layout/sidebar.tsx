import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  icon: string;
  href: string;
}

const adminNavItems: NavItem[] = [
  { label: "Дашборд", icon: "dashboard", href: "/" },
  { label: "Курсы", icon: "school", href: "/courses" },
  { label: "Сотрудники", icon: "groups", href: "/employees" },
  { label: "Медиатека", icon: "collections", href: "/media" },
  { label: "Аналитика", icon: "insert_chart", href: "/analytics" },
  { label: "Настройки", icon: "settings", href: "/settings" },
];

const staffNavItems: NavItem[] = [
  { label: "Мое обучение", icon: "menu_book", href: "/my-learning" },
  { label: "Достижения", icon: "stars", href: "/achievements" },
  { label: "Обсуждения", icon: "forum", href: "/discussions" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  if (!user) return null;
  
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-neutral-200 shadow-sm h-screen">
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center">
          <span className="material-icons text-primary mr-2">hotel</span>
          <h1 className="font-sans font-bold text-xl text-primary">HotelLearn</h1>
        </div>
        <p className="text-sm text-neutral-600 mt-1">Система обучения персонала</p>
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
                  <a className={cn(
                    "flex items-center px-2 py-2 rounded-md",
                    location === item.href 
                      ? "text-primary font-medium bg-primary bg-opacity-10" 
                      : "text-neutral-700 hover:bg-neutral-100"
                  )}>
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
                  <a className={cn(
                    "flex items-center px-2 py-2 rounded-md",
                    location === item.href 
                      ? "text-primary font-medium bg-primary bg-opacity-10" 
                      : "text-neutral-700 hover:bg-neutral-100"
                  )}>
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
      
      {/* User profile at bottom */}
      <div className="mt-auto p-4 border-t border-neutral-200">
        <div className="flex items-center">
          <Avatar className="w-8 h-8 mr-2">
            <AvatarImage src={user.avatar || ""} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-neutral-500">{user.role === "admin" ? "Тренинг-менеджер" : user.position}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto" 
            onClick={logout}
            aria-label="Выйти"
          >
            <span className="material-icons text-neutral-400 hover:text-neutral-600">logout</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
