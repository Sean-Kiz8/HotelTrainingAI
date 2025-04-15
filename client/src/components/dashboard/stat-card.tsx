import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: string;
  iconColor: string;
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: "up" | "down";
  };
}

export function StatCard({ icon, iconColor, title, value, change }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center mb-2">
        <span className={cn("material-icons mr-2", iconColor)}>{icon}</span>
        <h3 className="text-neutral-600 font-medium text-sm">{title}</h3>
      </div>
      <p className="text-3xl font-sans font-bold">{value}</p>
      {change && (
        <div className={cn(
          "mt-2 flex items-center text-xs",
          change.trend === "up" ? "text-success" : "text-error"
        )}>
          <span className="material-icons text-xs mr-1">
            {change.trend === "up" ? "arrow_upward" : "arrow_downward"}
          </span>
          <span>{change.value}</span>
        </div>
      )}
    </Card>
  );
}
