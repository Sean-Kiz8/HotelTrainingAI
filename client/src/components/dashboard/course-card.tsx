import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Clock, Users, CheckCircle2, BookOpen } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CourseCardProps {
  id: number;
  title: string;
  description: string;
  department: string;
  participantCount: number;
  image: string | null;
  rating: number;
  ratingCount: number;
  completionRate?: number;
  duration?: number;
  onClick?: () => void;
}

function Stars({ rating, count }: { rating: number, count: number }) {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <span 
          key={i} 
          className={`material-icons text-sm ${i < rating ? 'text-yellow-400' : 'text-neutral-300'}`}
        >
          star
        </span>
      ))}
      <span className="text-neutral-500 text-xs ml-1">({count})</span>
    </div>
  );
}

// Map department to background and text color
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

export function CourseCard({ 
  id,
  title, 
  description, 
  department, 
  participantCount,
  image,
  rating, 
  ratingCount,
  completionRate = 0,
  duration = 0,
  onClick 
}: CourseCardProps) {
  const { bg, text } = getDepartmentStyles(department);
  
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
      <CardHeader className="p-0">
        <div className={`h-40 ${bg} relative overflow-hidden`}>
          {image ? (
            <img 
              src={image} 
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <BookOpen className={`h-16 w-16 ${text}`} />
            </div>
          )}
          <Badge 
            variant="outline" 
            className={`${bg} ${text} border-0 px-2 py-1 rounded-full absolute top-3 left-3`}
          >
            {department}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-3">
        <Link href={`/course-details/${id}`} className="no-underline">
          <h4 className="font-sans font-medium text-lg hover:text-primary cursor-pointer">
            {title}
          </h4>
        </Link>
        
        <p className="text-neutral-600 text-sm line-clamp-2">{description}</p>
        
        {completionRate > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Прогресс</span>
              <span>{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-1.5" />
          </div>
        )}
        
        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1.5 text-neutral-500" />
            <span>{participantCount}</span>
          </div>
          
          {duration > 0 && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1.5 text-neutral-500" />
              <span>{duration} час.</span>
            </div>
          )}
          
          <div className="flex items-center ml-auto">
            <Stars rating={rating} count={ratingCount} />
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="px-4 py-3 bg-gray-50 flex justify-between">
        <span className="text-neutral-500 text-xs">
          {completionRate === 100 ? (
            <div className="flex items-center text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              <span>Завершен</span>
            </div>
          ) : 'Активный курс'}
        </span>
        
        <Link href={`/course-details/${id}`}>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-primary hover:text-primary-dark hover:bg-primary/10"
            onClick={(e) => {
              if (onClick) {
                e.stopPropagation();
                onClick();
              }
            }}
          >
            Подробнее
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
