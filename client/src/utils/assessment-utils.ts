// Assessment utility functions

export type BadgeVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'success';

export const formatStatus = (status: string): string => {
  switch (status) {
    case "created": return "Создан";
    case "in_progress": return "В процессе";
    case "completed": return "Завершен";
    default: return status;
  }
};

export const getStatusColor = (status: string): BadgeVariant => {
  switch (status) {
    case "created": return "secondary";
    case "in_progress": return "default";
    case "completed": return "success";
    default: return "default";
  }
};

export const formatLevel = (level: string): string => {
  switch (level) {
    case "junior": return "Junior";
    case "middle": return "Middle";
    case "senior": return "Senior";
    default: return level;
  }
}; 