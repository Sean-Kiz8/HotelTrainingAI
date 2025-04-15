import { Link } from "wouter";

export function Header() {
  return (
    <header className="bg-white shadow-sm p-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <span className="material-icons text-primary text-2xl mr-2">hotel</span>
            <h1 className="text-xl font-semibold text-primary">HotelLearn</h1>
          </div>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/">
            <span className="text-neutral-700 hover:text-primary transition-colors cursor-pointer">
              Главная
            </span>
          </Link>
          <Link href="/courses">
            <span className="text-neutral-700 hover:text-primary transition-colors cursor-pointer">
              Курсы
            </span>
          </Link>
          <Link href="/employees">
            <span className="text-neutral-700 hover:text-primary transition-colors cursor-pointer">
              Сотрудники
            </span>
          </Link>
          <Link href="/analytics">
            <span className="text-neutral-700 hover:text-primary transition-colors cursor-pointer">
              Аналитика
            </span>
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="material-icons text-neutral-500 mr-2 cursor-pointer">notifications</span>
            <span className="material-icons text-neutral-500 cursor-pointer">account_circle</span>
          </div>
        </div>
      </div>
    </header>
  );
}