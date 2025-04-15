import { useEffect } from "react";

export default function Mockup() {
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

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="material-icons text-primary text-2xl mr-2">hotel</span>
            <h1 className="text-xl font-semibold text-primary">HotelLearn</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="material-icons text-neutral-500 mr-2">notifications</span>
              <span className="material-icons text-neutral-500">account_circle</span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 md:p-6">
        <h2 className="text-2xl font-semibold mb-6">Панель управления</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-neutral-600">Всего сотрудников</p>
                <p className="text-2xl font-semibold mt-1">126</p>
              </div>
              <span className="material-icons text-primary text-2xl">person</span>
            </div>
            <div className="mt-2 text-xs text-success flex items-center">
              <span className="material-icons text-xs mr-1">trending_up</span>
              <span>+8% с прошлого месяца</span>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-neutral-600">Активных курсов</p>
                <p className="text-2xl font-semibold mt-1">24</p>
              </div>
              <span className="material-icons text-secondary text-2xl">menu_book</span>
            </div>
            <div className="mt-2 text-xs text-success flex items-center">
              <span className="material-icons text-xs mr-1">add</span>
              <span>+3 новых курса</span>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-neutral-600">Завершенных курсов</p>
                <p className="text-2xl font-semibold mt-1">342</p>
              </div>
              <span className="material-icons text-accent text-2xl">school</span>
            </div>
            <div className="mt-2 text-xs text-success flex items-center">
              <span className="material-icons text-xs mr-1">trending_up</span>
              <span>+12% с прошлого месяца</span>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-neutral-600">Средний прогресс</p>
                <p className="text-2xl font-semibold mt-1">68%</p>
              </div>
              <span className="material-icons text-warning text-2xl">insights</span>
            </div>
            <div className="mt-2 text-xs text-error flex items-center">
              <span className="material-icons text-xs mr-1">trending_down</span>
              <span>-2% с прошлого месяца</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2 bg-white rounded-lg shadow-sm">
            <div className="p-5 border-b border-neutral-200">
              <h3 className="font-semibold text-lg">Недавняя активность</h3>
            </div>
            <div className="p-0">
              <ul className="divide-y divide-neutral-200">
                <li className="p-4 hover:bg-neutral-50">
                  <div className="flex items-start">
                    <span className="material-icons text-success mt-1 mr-3">check_circle</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        <span className="text-primary">Анна Петрова</span> завершила курс <span className="text-neutral-800 font-medium">Стандарты обслуживания номеров</span>
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">2 часа назад</p>
                    </div>
                  </div>
                </li>
                <li className="p-4 hover:bg-neutral-50">
                  <div className="flex items-start">
                    <span className="material-icons text-primary mt-1 mr-3">add_circle</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        <span className="text-primary">Вы</span> создали новый курс <span className="text-neutral-800 font-medium">Работа с жалобами гостей</span>
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">Вчера</p>
                    </div>
                  </div>
                </li>
                <li className="p-4 hover:bg-neutral-50">
                  <div className="flex items-start">
                    <span className="material-icons text-info mt-1 mr-3">person_add</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        <span className="text-primary">Михаил Иванов</span> начал прохождение курса <span className="text-neutral-800 font-medium">Ресторанный сервис</span>
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">2 дня назад</p>
                    </div>
                  </div>
                </li>
              </ul>
              <div className="p-4 border-t border-neutral-200 text-center">
                <button className="text-primary text-sm font-medium hover:text-primary-dark">
                  Посмотреть все активности
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-5 border-b border-neutral-200">
              <h3 className="font-semibold text-lg">Статус адаптации</h3>
            </div>
            <div className="p-4">
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium">Ольга Смирнова</p>
                    <p className="text-sm text-neutral-600">25%</p>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div className="bg-error rounded-full h-2" style={{ width: '25%' }}></div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">Ресепшн • 3 дня</p>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium">Александр Петров</p>
                    <p className="text-sm text-neutral-600">65%</p>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div className="bg-warning rounded-full h-2" style={{ width: '65%' }}></div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">Ресторан • 2 недели</p>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium">Мария Иванова</p>
                    <p className="text-sm text-neutral-600">90%</p>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div className="bg-success rounded-full h-2" style={{ width: '90%' }}></div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">Обслуживание номеров • 27 дней</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-200">
                <button className="w-full bg-secondary hover:bg-secondary-dark text-white py-2 px-4 rounded">
                  <span className="material-icons text-sm mr-1">add</span>
                  Добавить сотрудника
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Недавние курсы</h3>
            <button className="text-primary text-sm hover:text-primary-dark flex items-center">
              Все курсы
              <span className="material-icons text-sm ml-1">arrow_forward</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="h-40 bg-primary-light flex items-center justify-center">
                <span className="material-icons text-5xl text-primary">room_service</span>
              </div>
              <div className="p-4">
                <div className="flex justify-between">
                  <span className="bg-primary-light text-primary px-2 py-1 rounded-full text-xs">Обслуживание номеров</span>
                  <span className="text-neutral-500 text-xs">32 участника</span>
                </div>
                <h4 className="font-medium text-lg mt-2">Стандарты обслуживания номеров</h4>
                <p className="text-neutral-600 text-sm mt-1">Курс по стандартам уборки и подготовки номеров, правила работы с клиентами.</p>
                <div className="mt-3 flex justify-between items-center">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <span 
                        key={i} 
                        className={`material-icons text-sm ${i < 4 ? 'text-yellow-400' : 'text-neutral-300'}`}
                      >
                        star
                      </span>
                    ))}
                    <span className="text-neutral-500 text-xs ml-1">(16)</span>
                  </div>
                  <button className="text-primary text-sm hover:text-primary-dark">
                    Подробнее
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="h-40 bg-secondary-light flex items-center justify-center">
                <span className="material-icons text-5xl text-secondary">restaurant</span>
              </div>
              <div className="p-4">
                <div className="flex justify-between">
                  <span className="bg-secondary-light text-secondary px-2 py-1 rounded-full text-xs">Ресторан</span>
                  <span className="text-neutral-500 text-xs">28 участников</span>
                </div>
                <h4 className="font-medium text-lg mt-2">Ресторанный сервис</h4>
                <p className="text-neutral-600 text-sm mt-1">Основы ресторанного обслуживания, стандарты сервировки и работа с клиентами.</p>
                <div className="mt-3 flex justify-between items-center">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <span 
                        key={i} 
                        className={`material-icons text-sm ${i < 5 ? 'text-yellow-400' : 'text-neutral-300'}`}
                      >
                        star
                      </span>
                    ))}
                    <span className="text-neutral-500 text-xs ml-1">(22)</span>
                  </div>
                  <button className="text-primary text-sm hover:text-primary-dark">
                    Подробнее
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="h-40 bg-accent-light flex items-center justify-center">
                <span className="material-icons text-5xl text-accent">people</span>
              </div>
              <div className="p-4">
                <div className="flex justify-between">
                  <span className="bg-accent-light text-accent px-2 py-1 rounded-full text-xs">Адаптация</span>
                  <span className="text-neutral-500 text-xs">48 участников</span>
                </div>
                <h4 className="font-medium text-lg mt-2">Базовый курс для новых сотрудников</h4>
                <p className="text-neutral-600 text-sm mt-1">Основы работы в отеле, структура, правила внутреннего распорядка.</p>
                <div className="mt-3 flex justify-between items-center">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <span 
                        key={i} 
                        className={`material-icons text-sm ${i < 4 ? 'text-yellow-400' : 'text-neutral-300'}`}
                      >
                        star
                      </span>
                    ))}
                    <span className="text-neutral-500 text-xs ml-1">(36)</span>
                  </div>
                  <button className="text-primary text-sm hover:text-primary-dark">
                    Подробнее
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <div className="fixed bottom-6 right-6 z-20">
        <div className="bg-primary text-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-primary-dark transition-colors">
          <span className="material-icons">smart_toy</span>
        </div>
      </div>
    </div>
  );
}