import { Link } from "wouter";

export function Header() {
  return (
    <header className="bg-white shadow-sm p-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center">
            <span className="material-icons text-primary text-2xl mr-2">hotel</span>
            <h1 className="text-xl font-semibold text-primary">HotelLearn</h1>
          </a>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/">
            <a className="text-neutral-700 hover:text-primary transition-colors">
              Главная
            </a>
          </Link>
          <Link href="/courses">
            <a className="text-neutral-700 hover:text-primary transition-colors">
              Курсы
            </a>
          </Link>
          <Link href="/employees">
            <a className="text-neutral-700 hover:text-primary transition-colors">
              Сотрудники
            </a>
          </Link>
          <Link href="/analytics">
            <a className="text-neutral-700 hover:text-primary transition-colors">
              Аналитика
            </a>
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="material-icons text-neutral-500 mr-2">notifications</span>
            <span className="material-icons text-neutral-500">account_circle</span>
          </div>
        </div>
      </div>
    </header>
  );
}