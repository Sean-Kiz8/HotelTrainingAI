import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function CacheTestPage() {
  const [key, setKey] = useState('test_key');
  const [value, setValue] = useState('');
  const [prefix, setPrefix] = useState('test');
  const [ttl, setTtl] = useState('3600');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Установка значения в кеш
  const handleSet = async () => {
    if (!key) {
      setError('Ключ не может быть пустым');
      return;
    }

    if (!value) {
      setError('Значение не может быть пустым');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/cache/set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prefix,
          key,
          value,
          ttl: parseInt(ttl),
        }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(`Ошибка: ${err}`);
      console.error('Error setting cache:', err);
    } finally {
      setLoading(false);
    }
  };

  // Получение значения из кеша
  const handleGet = async () => {
    if (!key) {
      setError('Ключ не может быть пустым');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/cache/get?prefix=${prefix}&key=${key}`);
      
      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      
      if (data.success && data.data) {
        setValue(typeof data.data === 'object' ? JSON.stringify(data.data, null, 2) : data.data.toString());
      }
    } catch (err) {
      setError(`Ошибка: ${err}`);
      console.error('Error getting cache:', err);
    } finally {
      setLoading(false);
    }
  };

  // Удаление значения из кеша
  const handleDelete = async () => {
    if (!key) {
      setError('Ключ не может быть пустым');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/cache/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prefix,
          key,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        setValue('');
      }
    } catch (err) {
      setError(`Ошибка: ${err}`);
      console.error('Error deleting cache:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Тестирование Replit DB кеширования</h1>
      
      {error && (
        <div className="mb-4 p-4 rounded-md bg-red-50 text-red-700">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Управление кешем</CardTitle>
            <CardDescription>Тестирование механизма кеширования с Replit DB</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="prefix">Префикс</Label>
              <Input 
                id="prefix" 
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="test"
              />
              <p className="text-sm text-gray-500">Префикс для группировки кешей</p>
            </div>
            
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="key">Ключ</Label>
              <Input 
                id="key" 
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="test_key"
              />
            </div>
            
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="value">Значение</Label>
              <Textarea 
                id="value" 
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Введите значение для кеширования"
                rows={5}
              />
            </div>
            
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="ttl">Время жизни (секунды)</Label>
              <Input 
                id="ttl" 
                type="number"
                value={ttl}
                onChange={(e) => setTtl(e.target.value)}
                placeholder="3600"
              />
              <p className="text-sm text-gray-500">Время в секундах до истечения срока кеша</p>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button 
              onClick={handleSet} 
              disabled={loading || !key || !value}
            >
              {loading ? 'Загрузка...' : 'Установить'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleGet} 
              disabled={loading || !key}
            >
              Получить
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={loading || !key}
            >
              Удалить
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Результат операции</CardTitle>
            <CardDescription>Ответ от сервера после выполнения операции</CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[400px] text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">Выполните операцию, чтобы увидеть результат</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}