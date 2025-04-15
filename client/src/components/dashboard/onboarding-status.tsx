import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface OnboardingItemProps {
  name: string;
  department: string;
  progress: number;
  duration: string;
}

function OnboardingItem({ name, department, progress, duration }: OnboardingItemProps) {
  // Determine color based on progress
  let progressColor;
  if (progress < 30) progressColor = "bg-error";
  else if (progress < 80) progressColor = "bg-warning";
  else progressColor = "bg-success";
  
  return (
    <div>
      <div className="flex justify-between mb-1">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-sm text-neutral-600">{progress}%</p>
      </div>
      <div className="w-full bg-neutral-200 rounded-full h-2">
        <div className={`${progressColor} rounded-full h-2`} style={{ width: `${progress}%` }}></div>
      </div>
      <p className="text-xs text-neutral-500 mt-1">{department} • {duration}</p>
    </div>
  );
}

export function OnboardingStatus() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/onboarding"],
  });
  
  return (
    <Card>
      <CardHeader className="p-5 border-b border-neutral-200">
        <CardTitle className="font-sans font-semibold text-lg">Статус адаптации</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-5">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-10" />
                </div>
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))
          ) : (
            data?.map((employee: OnboardingItemProps) => (
              <OnboardingItem
                key={employee.name}
                name={employee.name}
                department={employee.department}
                progress={employee.progress}
                duration={employee.duration}
              />
            ))
          )}
          
          {!isLoading && !data?.length && (
            <p className="text-center text-neutral-500 py-4">
              Нет сотрудников в процессе адаптации
            </p>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-neutral-200">
          <Button className="w-full bg-secondary hover:bg-secondary-dark text-white">
            <span className="material-icons text-sm mr-1">add</span>
            Добавить сотрудника
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
