import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityItemProps {
  icon: string;
  iconColor: string;
  content: React.ReactNode;
  timestamp: string;
}

function ActivityItem({ icon, iconColor, content, timestamp }: ActivityItemProps) {
  return (
    <li className="p-4 hover:bg-neutral-50">
      <div className="flex items-start">
        <span className={`material-icons ${iconColor} mt-1 mr-3`}>{icon}</span>
        <div className="flex-1">
          <p className="text-sm font-medium">{content}</p>
          <p className="text-xs text-neutral-500 mt-1">{timestamp}</p>
        </div>
      </div>
    </li>
  );
}

// Helper function to format timestamp
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'} назад`;
  } else if (hours > 0) {
    return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'} назад`;
  } else if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? 'минута' : minutes < 5 ? 'минуты' : 'минут'} назад`;
  } else {
    return 'Только что';
  }
}

export function RecentActivity() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/activities"],
  });
  
  return (
    <Card className="md:col-span-2">
      <CardHeader className="p-5 border-b border-neutral-200">
        <CardTitle className="font-sans font-semibold text-lg">Недавняя активность</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start">
                <Skeleton className="h-6 w-6 rounded-full mr-3" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {activities?.map((activity: any) => {
              // Determine icon and color based on activity type
              let icon = "info";
              let iconColor = "text-info";
              
              switch(activity.type) {
                case "completed_course":
                  icon = "check_circle";
                  iconColor = "text-success";
                  break;
                case "created_course":
                  icon = "add_circle";
                  iconColor = "text-primary";
                  break;
                case "started_course":
                  icon = "person_add";
                  iconColor = "text-info";
                  break;
                case "updated_course":
                  icon = "update";
                  iconColor = "text-warning";
                  break;
              }
              
              // Create content based on activity type
              let content;
              const userName = activity.user?.name || "Пользователь";
              const courseTitle = activity.course?.title || "курс";
              const isCurrentUser = activity.user?.name === "Елена Смирнова";
              
              switch(activity.type) {
                case "completed_course":
                  content = (
                    <>
                      <span className="text-primary">{userName}</span> завершила курс <span className="text-neutral-800 font-medium">{courseTitle}</span>
                    </>
                  );
                  break;
                case "created_course":
                  content = (
                    <>
                      <span className="text-primary">{isCurrentUser ? "Вы" : userName}</span> создали новый курс <span className="text-neutral-800 font-medium">{courseTitle}</span>
                    </>
                  );
                  break;
                case "started_course":
                  content = (
                    <>
                      <span className="text-primary">{userName}</span> начал прохождение курса <span className="text-neutral-800 font-medium">{courseTitle}</span>
                    </>
                  );
                  break;
                case "updated_course":
                  content = (
                    <>
                      <span className="text-primary">{isCurrentUser ? "Вы" : userName}</span> обновили материалы курса <span className="text-neutral-800 font-medium">{courseTitle}</span>
                    </>
                  );
                  break;
              }
              
              return (
                <ActivityItem 
                  key={activity.id}
                  icon={icon}
                  iconColor={iconColor}
                  content={content}
                  timestamp={formatTimeAgo(new Date(activity.timestamp))}
                />
              );
            })}
            
            {!activities?.length && (
              <li className="p-4 text-center text-neutral-500">
                Нет активностей для отображения
              </li>
            )}
          </ul>
        )}
        <div className="p-4 border-t border-neutral-200 text-center">
          <Button variant="link" className="text-primary text-sm font-medium hover:text-primary-dark">
            Посмотреть все активности
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
