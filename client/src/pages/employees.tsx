import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, SearchInput, CreateButton } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Employees() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
  });
  
  // Filter out admin users and filter by search query
  const employees = users?.filter((user: any) => 
    user.role !== "admin" && 
    (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.position?.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <PageHeader title="Сотрудники">
        <SearchInput 
          placeholder="Поиск сотрудников..." 
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <CreateButton 
          label="Добавить сотрудника"
          onClick={() => toast({
            title: "Добавление сотрудника",
            description: "Функциональность находится в разработке",
          })}
        />
      </PageHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))
        ) : (
          <>
            {employees && employees.length > 0 ? (
              employees.map((employee: any) => (
                <Card key={employee.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 flex items-center">
                      <Avatar className="h-12 w-12 mr-3">
                        <AvatarImage src={employee.avatar || ""} alt={employee.name} />
                        <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{employee.name}</h3>
                        <p className="text-sm text-neutral-500">{employee.position || "Не указано"}</p>
                        {employee.department && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {employee.department}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="px-4 pb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-neutral-500">Прогресс обучения</span>
                        <span className="text-xs font-medium">
                          {Math.floor(Math.random() * 100)}%
                        </span>
                      </div>
                      <Progress value={Math.floor(Math.random() * 100)} className="h-1" />
                      
                      <div className="flex justify-between mt-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                          onClick={() => toast({
                            title: "Просмотр профиля",
                            description: `Профиль сотрудника: ${employee.name}`,
                          })}
                        >
                          Профиль
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => toast({
                            title: "Назначение курса",
                            description: `Выбран сотрудник: ${employee.name}`,
                          })}
                        >
                          Назначить курс
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-neutral-500">
                {searchQuery ? (
                  <p>Сотрудники по запросу "{searchQuery}" не найдены</p>
                ) : (
                  <p>Нет сотрудников в системе</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
