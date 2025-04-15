import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    position: user?.position || "",
    department: user?.department || "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    courseCompletions: true,
    newCourses: true,
    systemUpdates: false,
  });

  // Загрузка сохраненных настроек уведомлений при инициализации компонента
  useEffect(() => {
    if (user) {
      try {
        // Проверяем, есть ли настройки в поле preferences пользователя
        console.log('Данные пользователя:', user);

        if (user.preferences) {
          try {
            // Проверяем, является ли preferences строкой или объектом
            const userPreferences = typeof user.preferences === 'string'
              ? JSON.parse(user.preferences)
              : user.preferences;

            console.log('Парсинг настроек:', userPreferences);

            if (userPreferences && userPreferences.notifications) {
              console.log('Загружены настройки уведомлений из базы данных:', userPreferences.notifications);
              setNotificationSettings(userPreferences.notifications);
              return;
            }
          } catch (parseError) {
            console.error('Ошибка при парсинге настроек из базы данных:', parseError);
          }
        }

        // Если нет настроек в базе, проверяем localStorage
        const savedSettings = localStorage.getItem(`user_${user.id}_notifications`);
        if (savedSettings) {
          setNotificationSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Ошибка при загрузке настроек уведомлений:', error);
      }
    }
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveProfile = async () => {
    try {
      if (user) {
        // Получаем текущие настройки пользователя, чтобы не потерять их
        let currentPreferences = {};
        if (user.preferences) {
          try {
            currentPreferences = typeof user.preferences === 'string'
              ? JSON.parse(user.preferences)
              : user.preferences;
          } catch (e) {
            console.warn('Ошибка при парсинге текущих настроек:', e);
          }
        }

        // Отправляем данные на сервер для сохранения в базу данных
        const response = await fetch(`/api/users/${user.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...profileForm,
            // Сохраняем текущие настройки
            preferences: currentPreferences
          }),
        });

        if (!response.ok) {
          throw new Error(`Ошибка при сохранении данных: ${response.status}`);
        }

        // Получаем обновленные данные пользователя
        const updatedUser = await response.json();
        console.log('Обновленные данные пользователя:', updatedUser);

        // Для подстраховки сохраняем данные в localStorage
        localStorage.setItem('updatedUserData', JSON.stringify(updatedUser));

        // Обновляем данные пользователя в контексте
        await refreshUser();

        toast({
          title: "Профиль обновлен",
          description: "Изменения успешно сохранены в базе данных",
        });
      }
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось обновить профиль",
        variant: "destructive",
      });
    }
  };

  const handleToggleNotification = (setting: string) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting as keyof typeof notificationSettings],
    });
  };

  const handleSaveNotifications = async () => {
    try {
      if (user) {
        // Сохраняем настройки в localStorage для демонстрации
        localStorage.setItem(`user_${user.id}_notifications`, JSON.stringify(notificationSettings));

        // Получаем текущие настройки пользователя, если они есть
        let currentPreferences = {};
        if (user.preferences) {
          try {
            currentPreferences = typeof user.preferences === 'string'
              ? JSON.parse(user.preferences)
              : user.preferences;
          } catch (e) {
            console.warn('Ошибка при парсинге текущих настроек:', e);
          }
        }

        // Обновляем настройки уведомлений
        const updatedPreferences = {
          ...currentPreferences,
          notifications: notificationSettings
        };

        console.log('Сохраняем настройки в базу данных:', updatedPreferences);

        // Сохраняем настройки в поле preferences пользователя
        const response = await fetch(`/api/users/${user.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            preferences: updatedPreferences
          }),
        });

        if (!response.ok) {
          throw new Error(`Ошибка при сохранении настроек: ${response.status}`);
        }

        // Обновляем данные пользователя в контексте
        await refreshUser();

        toast({
          title: "Настройки уведомлений обновлены",
          description: "Изменения успешно сохранены",
        });
      }
    } catch (error) {
      console.error('Ошибка при сохранении настроек уведомлений:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось сохранить настройки уведомлений",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <PageHeader title="Настройки" />

      <Tabs defaultValue="profile" className="mb-6">
        <TabsList>
          <TabsTrigger value="profile">Профиль</TabsTrigger>
          <TabsTrigger value="notifications">Уведомления</TabsTrigger>
          <TabsTrigger value="system">Система</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Информация профиля</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.avatar || ""} alt={user?.name} />
                  <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{user?.name}</h3>
                  <p className="text-sm text-neutral-500">{user?.role === "admin" ? "Тренинг-менеджер" : user?.position}</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-primary p-0 h-auto mt-1"
                    onClick={() => toast({
                      title: "Изменение фото",
                      description: "Функциональность находится в разработке",
                    })}
                  >
                    Изменить фото
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Имя</Label>
                  <Input
                    id="name"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Должность</Label>
                  <Input
                    id="position"
                    name="position"
                    value={profileForm.position}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Отдел</Label>
                  <Input
                    id="department"
                    name="department"
                    value={profileForm.department}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button onClick={handleSaveProfile}>Сохранить изменения</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Настройки уведомлений</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email уведомления</h3>
                  <p className="text-sm text-neutral-500">Получать все уведомления на email</p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={() => handleToggleNotification("emailNotifications")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Завершение курсов</h3>
                  <p className="text-sm text-neutral-500">Уведомления о завершении курсов сотрудниками</p>
                </div>
                <Switch
                  checked={notificationSettings.courseCompletions}
                  onCheckedChange={() => handleToggleNotification("courseCompletions")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Новые курсы</h3>
                  <p className="text-sm text-neutral-500">Уведомления о добавлении новых курсов</p>
                </div>
                <Switch
                  checked={notificationSettings.newCourses}
                  onCheckedChange={() => handleToggleNotification("newCourses")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Обновления системы</h3>
                  <p className="text-sm text-neutral-500">Уведомления об обновлениях системы</p>
                </div>
                <Switch
                  checked={notificationSettings.systemUpdates}
                  onCheckedChange={() => handleToggleNotification("systemUpdates")}
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button onClick={handleSaveNotifications}>Сохранить настройки</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Системные настройки</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-neutral-500">
                <p>Эта функциональность находится в разработке</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
