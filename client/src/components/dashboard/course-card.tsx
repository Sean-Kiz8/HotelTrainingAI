import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CourseCardProps {
  title: string;
  description: string;
  department: string;
  participantCount: number;
  image: string | null;
  rating: number;
  ratingCount: number;
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
  title, 
  description, 
  department, 
  participantCount,
  image,
  rating, 
  ratingCount,
  onClick 
}: CourseCardProps) {
  const { bg, text } = getDepartmentStyles(department);
  
  return (
    <Card className="overflow-hidden">
      <div className={`h-40 ${bg} flex items-center justify-center`}>
        {image ? (
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className={`material-icons text-5xl ${text}`}>school</span>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between">
          <Badge variant="outline" className={`${bg} ${text} border-0 px-2 py-1 rounded-full`}>
            {department}
          </Badge>
          <span className="text-neutral-500 text-xs">{participantCount} участников</span>
        </div>
        <h4 className="font-sans font-medium text-lg mt-2">{title}</h4>
        <p className="text-neutral-600 text-sm mt-1">{description}</p>
        <div className="mt-3 flex justify-between items-center">
          <Stars rating={rating} count={ratingCount} />
          <Button variant="link" className="text-primary text-sm hover:text-primary-dark" onClick={onClick}>
            Подробнее
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
