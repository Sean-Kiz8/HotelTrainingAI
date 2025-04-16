import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { HelpCircle, RefreshCw, Trash2, Save, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const CacheTestPage = () => {
  const [cachePrefix, setCachePrefix] = useState<string>('courses');
  const [cacheKey, setCacheKey] = useState<string>('test');
  const [cacheValue, setCacheValue] = useState<string>('');
  const [cacheTTL, setCacheTTL] = useState<number>(3600);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Запрос для получения данных из кеша
  const getCacheQuery = useQuery({
    queryKey: ['/api/cache/get', cachePrefix, cacheKey],
    queryFn: async () => {
      const response = await fetch(`/api/cache/get?prefix=${cachePrefix}&key=${cacheKey}`);
      if (!response.ok) {
        throw new Error('Ошибка при получении данных из кеша');
      }
      return response.json();
    },
    enabled: !!cachePrefix && !!cacheKey,
    refetchInterval: refreshInterval,
  });

  // Мутация для установки данных в кеш
  const setCacheMutation = useMutation({
    mutationFn: async (data: { prefix: string; key: string; value: string; ttl?: number }) => {
      return apiRequest('POST', '/api/cache/set', data);
    },
    onSuccess: () => {
      toast({
        title: 'Кеш обновлен',
        description: `Данные успешно сохранены в кеш ${cachePrefix}:${cacheKey}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cache/get', cachePrefix, cacheKey] });
    },
    onError: (error) => {
      toast({
        title: 'Ошибка',
        description: `Не удалось сохранить данные в кеш: ${error}`,
        variant: 'destructive',
      });
    },
  });

  // Мутация для очистки кеша
  const clearCacheMutation = useMutation({
    mutationFn: async (options: { prefix: string; key?: string }) => {
      const url = options.key
        ? `/api/cache/clear?prefix=${options.prefix}&key=${options.key}`
        : `/api/cache/clear?prefix=${options.prefix}`;
      return apiRequest(url, { method: 'DELETE' });
    },
    onSuccess: (data, variables) => {
      if (variables.key) {
        toast({
          title: 'Кеш очищен',
          description: `Ключ ${variables.key} удален из кеша ${variables.prefix}`,
        });
      } else {
        toast({
          title: 'Кеш очищен',
          description: `Весь кеш ${variables.prefix} был очищен`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/cache/get'] });
    },
    onError: (error) => {
      toast({
        title: 'Ошибка',
        description: `Не удалось очистить кеш: ${error}`,
        variant: 'destructive',
      });
    },
  });

  // Эффект для установки начальных данных в форму, если они получены из кеша
  useEffect(() => {
    if (getCacheQuery.data?.data?.value) {
      try {
        if (typeof getCacheQuery.data.data.value === 'object') {
          setCacheValue(JSON.stringify(getCacheQuery.data.data.value, null, 2));
        } else {
          setCacheValue(getCacheQuery.data.data.value);
        }
      } catch (e) {
        setCacheValue(String(getCacheQuery.data.data.value));
      }
    }
  }, [getCacheQuery.data]);

  // Обработчик сохранения данных в кеш
  const handleSaveCache = () => {
    try {
      // Попытка распарсить JSON, если данные в формате JSON
      let valueToCache;
      try {
        valueToCache = JSON.parse(cacheValue);
      } catch (e) {
        // Если не JSON, то сохраняем как строку
        valueToCache = cacheValue;
      }

      setCacheMutation.mutate({
        prefix: cachePrefix,
        key: cacheKey,
        value: valueToCache,
        ttl: cacheTTL > 0 ? cacheTTL : undefined,
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: `Не удалось преобразовать данные: ${error}`,
        variant: 'destructive',
      });
    }
  };

  // Обработчик очистки кеша
  const handleClearCache = (key?: string) => {
    clearCacheMutation.mutate({
      prefix: cachePrefix,
      key: key || undefined,
    });
  };

  // Индикатор состояния кеша
  const renderCacheStatus = () => {
    if (getCacheQuery.isLoading) {
      return <Badge variant="outline" className="animate-pulse">Загрузка...</Badge>;
    }

    if (getCacheQuery.isError) {
      return <Badge variant="destructive">Ошибка</Badge>;
    }

    if (getCacheQuery.data?.found) {
      return <Badge variant="success">Найдено в кеше</Badge>;
    }

    return <Badge variant="secondary">Не найдено в кеше</Badge>;
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Тестирование системы кеширования</h1>
      
      <Tabs defaultValue="manage" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="manage">Управление кешем</TabsTrigger>
          <TabsTrigger value="info">Информация о кеше</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manage">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Получение данных из кеша</span>
                  {renderCacheStatus()}
                </CardTitle>
                <CardDescription>
                  Введите префикс и ключ кеша для получения данных
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="cache-prefix">Префикс кеша</Label>
                    <Select
                      value={cachePrefix}
                      onValueChange={setCachePrefix}
                    >
                      <SelectTrigger id="cache-prefix">
                        <SelectValue placeholder="Выберите префикс кеша" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="courses">courses (курсы)</SelectItem>
                        <SelectItem value="users">users (пользователи)</SelectItem>
                        <SelectItem value="media">media (медиафайлы)</SelectItem>
                        <SelectItem value="analytics">analytics (аналитика)</SelectItem>
                        <SelectItem value="assessments">assessments (оценки)</SelectItem>
                        <SelectItem value="custom">пользовательский</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {cachePrefix === 'custom' && (
                      <Input
                        placeholder="Введите префикс кеша"
                        value={cachePrefix === 'custom' ? '' : cachePrefix}
                        onChange={(e) => setCachePrefix(e.target.value)}
                        className="mt-2"
                      />
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="cache-key">Ключ кеша</Label>
                    <Input
                      id="cache-key"
                      placeholder="Ключ кеша"
                      value={cacheKey}
                      onChange={(e) => setCacheKey(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="refresh-interval">Интервал обновления (мс)</Label>
                    <Input
                      id="refresh-interval"
                      type="number"
                      placeholder="0 - отключено"
                      value={refreshInterval === null ? '' : refreshInterval}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setRefreshInterval(isNaN(value) || value <= 0 ? null : value);
                      }}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/cache/get', cachePrefix, cacheKey] })}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Обновить
                </Button>
                
                <Button variant="destructive" onClick={() => handleClearCache(cacheKey)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Запись данных в кеш</CardTitle>
                <CardDescription>
                  Введите данные для сохранения в кеш
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="cache-value">Данные (JSON или текст)</Label>
                    <Textarea
                      id="cache-value"
                      placeholder="Введите данные для кеширования (объект JSON или текст)"
                      value={cacheValue}
                      onChange={(e) => setCacheValue(e.target.value)}
                      rows={8}
                    />
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="cache-ttl">Время жизни кеша (секунды)</Label>
                    <Input
                      id="cache-ttl"
                      type="number"
                      placeholder="Время жизни в секундах"
                      value={cacheTTL}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setCacheTTL(isNaN(value) ? 3600 : value);
                      }}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="secondary" onClick={() => setCacheValue('')}>
                  Очистить
                </Button>
                
                <Button 
                  variant="default" 
                  onClick={handleSaveCache}
                  disabled={!cacheValue || !cacheKey || setCacheMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Сохранить
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Результат запроса</CardTitle>
              <CardDescription>
                Результат последнего запроса к кешу
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-secondary p-4 rounded-md overflow-auto max-h-96">
                {getCacheQuery.isLoading ? (
                  <span className="text-muted-foreground">Загрузка...</span>
                ) : getCacheQuery.isError ? (
                  <span className="text-destructive">Ошибка: {String(getCacheQuery.error)}</span>
                ) : (
                  <code>{JSON.stringify(getCacheQuery.data, null, 2)}</code>
                )}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Информация о системе кеширования</CardTitle>
              <CardDescription>
                Общие сведения о механизме кеширования в приложении
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Доступные кеш-хранилища</h3>
                  <Separator className="my-2" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    {[
                      { name: 'courses', description: 'Кеш курсов', ttl: '1 час' },
                      { name: 'users', description: 'Кеш пользователей', ttl: '24 часа' },
                      { name: 'media', description: 'Кеш медиафайлов', ttl: '6 часов' },
                      { name: 'analytics', description: 'Кеш аналитики', ttl: '10 минут' },
                      { name: 'assessments', description: 'Кеш оценок', ttl: '30 минут' },
                    ].map((cache) => (
                      <Card key={cache.name} className="p-4 hover:bg-secondary/50 cursor-pointer transition-colors" 
                        onClick={() => {
                          setCachePrefix(cache.name);
                          queryClient.invalidateQueries({ queryKey: ['/api/cache/get']});
                        }}
                      >
                        <h4 className="font-semibold">{cache.name}</h4>
                        <p className="text-sm text-muted-foreground">{cache.description}</p>
                        <p className="text-xs mt-2">TTL по умолчанию: {cache.ttl}</p>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Операции с кешем</h3>
                  <Separator className="my-2" />
                  <ul className="list-disc list-inside space-y-2 mt-2">
                    <li><strong>get(key)</strong> - получение данных из кеша</li>
                    <li><strong>set(key, value, ttl)</strong> - запись данных в кеш с опциональным временем жизни</li>
                    <li><strong>delete(key)</strong> - удаление данных из кеша по ключу</li>
                    <li><strong>clear()</strong> - полная очистка кеша</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Действия</h3>
                  <Separator className="my-2" />
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button variant="outline" onClick={() => handleClearCache()}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Очистить выбранный кеш
                    </Button>
                    <Button variant="destructive" onClick={() => clearCacheMutation.mutate({ prefix: 'all' })}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Очистить все кеши
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CacheTestPage;