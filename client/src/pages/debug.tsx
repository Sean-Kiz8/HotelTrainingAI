import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";

export default function DebugPage() {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    console.log("Debug page render");
    console.log("User auth state:", { user, loading });
  }, [user, loading]);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Страница отладки</h1>
      
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Состояние авторизации:</h2>
        <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-40">
          {JSON.stringify({ user, loading }, null, 2)}
        </pre>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Проверка SideBar:</h2>
        <div className="flex flex-col space-y-2">
          <p>
            Боковая панель должна отображаться при ширине экрана md и выше.
          </p>
          <div className="flex space-x-2">
            <span className="hidden md:block bg-green-100 text-green-800 px-2 py-1 rounded">
              Экран ≥ md (Боковая панель должна быть видна)
            </span>
            <span className="md:hidden block bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Экран &lt; md (Боковое меню скрыто, должна отображаться мобильная шапка)
            </span>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Список всех маршрутов:</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><a href="/" className="text-blue-600 hover:underline">Дашборд</a></li>
          <li><a href="/courses" className="text-blue-600 hover:underline">Курсы</a></li>
          <li><a href="/employees" className="text-blue-600 hover:underline">Сотрудники</a></li>
          <li><a href="/media" className="text-blue-600 hover:underline">Медиатека</a></li>
          <li><a href="/analytics" className="text-blue-600 hover:underline">Аналитика</a></li>
          <li><a href="/settings" className="text-blue-600 hover:underline">Настройки</a></li>
          <li><a href="/my-learning" className="text-blue-600 hover:underline">Мое обучение</a></li>
          <li><a href="/achievements" className="text-blue-600 hover:underline">Достижения</a></li>
          <li><a href="/discussions" className="text-blue-600 hover:underline">Обсуждения</a></li>
        </ul>
      </div>
    </div>
  );
}