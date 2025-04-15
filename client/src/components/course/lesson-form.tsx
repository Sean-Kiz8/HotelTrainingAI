import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";

// Схема для создания нового урока
export const createLessonSchema = z.object({
  title: z.string().min(3, "Название должно содержать минимум 3 символа"),
  description: z.string().min(10, "Описание должно содержать минимум 10 символов"),
  content: z.string().min(20, "Содержимое урока должно содержать минимум 20 символов"),
  durationMinutes: z.number().min(1, "Длительность урока должна быть не менее 1 минуты"),
  moduleId: z.number(),
  orderIndex: z.number().optional(),
});

// Компонент формы для добавления урока
export function AddLessonForm({ 
  moduleId, 
  onSubmit, 
  isPending = false 
}: { 
  moduleId: number; 
  onSubmit: (data: z.infer<typeof createLessonSchema>) => void;
  isPending?: boolean;
}) {
  const form = useForm<z.infer<typeof createLessonSchema>>({
    resolver: zodResolver(createLessonSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      durationMinutes: 30,
      moduleId: moduleId,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название урока</FormLabel>
              <FormControl>
                <Input placeholder="Введите название урока" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Краткое описание</FormLabel>
              <FormControl>
                <Input placeholder="Введите краткое описание урока" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Содержимое урока</FormLabel>
              <FormControl>
                <textarea 
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Введите содержимое урока" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="durationMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Длительность (в минутах)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="1" 
                  placeholder="Длительность в минутах" 
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending && <span className="mr-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>}
            Добавить урок
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}