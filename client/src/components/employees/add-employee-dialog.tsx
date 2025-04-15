import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AddEmployeeForm } from "./add-employee-form";

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddEmployeeDialog({ open, onOpenChange }: AddEmployeeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Добавить нового сотрудника</DialogTitle>
          <DialogDescription>
            Заполните информацию о новом сотруднике. После создания сотрудник получит доступ к системе.
          </DialogDescription>
        </DialogHeader>
        <AddEmployeeForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
