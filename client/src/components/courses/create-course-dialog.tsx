import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CourseForm } from "./course-form";

interface CreateCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCourseDialog({ open, onOpenChange }: CreateCourseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Создание нового курса</DialogTitle>
        </DialogHeader>
        <CourseForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}