import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SharePreviewCardProps {
  id: number;
  title: string;
  description: string;
  department: string;
  instructor?: {
    name: string;
    avatar?: string;
  };
  image?: string | null;
}

// Функция для получения стилей отдела
function getDepartmentStyles(department: string): { bg: string, text: string } {
  switch (department) {
    case "Обслуживание номеров":
      return { bg: "bg-primary-light", text: "text-primary" };
    case "Ресторан":
      return { bg: "bg-secondary-light", text: "text-secondary" };
    case "Адаптация":
      return { bg: "bg-accent-light", text: "text-accent" };
    default:
      return { bg: "bg-neutral-200", text: "text-neutral-700" };
  }
}

// Функция для получения инициалов из имени
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
}

export function SharePreviewCard({ 
  id, 
  title, 
  description, 
  department, 
  instructor,
  image 
}: SharePreviewCardProps) {
  const { bg, text } = getDepartmentStyles(department);
  
  return (
    <Card className="overflow-hidden shadow-md w-full max-w-md">
      <div className="flex">
        <div className={`w-3 ${bg}`}></div>
        <CardContent className="p-4 flex-1">
          <div className="flex justify-between items-start mb-2">
            <Badge variant="outline" className={`${bg} ${text} border-0 px-2 py-1 rounded-full`}>
              {department}
            </Badge>
            {image && (
              <div className="w-16 h-16 overflow-hidden rounded">
                <img 
                  src={image} 
                  alt={title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          
          <h3 className="font-medium text-lg mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>
          
          {instructor && (
            <div className="flex items-center">
              <Avatar className="h-6 w-6 mr-2">
                {instructor.avatar ? (
                  <AvatarImage src={instructor.avatar} alt={instructor.name} />
                ) : (
                  <AvatarFallback>{getInitials(instructor.name)}</AvatarFallback>
                )}
              </Avatar>
              <span className="text-xs text-muted-foreground">{instructor.name}</span>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}