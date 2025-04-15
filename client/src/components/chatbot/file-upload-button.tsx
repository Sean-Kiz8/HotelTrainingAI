import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { uploadFileForChatAnalysis } from "@/lib/openai";

interface FileUploadButtonProps {
  userId: number;
  onUploadComplete: (chatMessage: any) => void;
  disabled?: boolean;
}

export function FileUploadButton({ userId, onUploadComplete, disabled = false }: FileUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      const result = await uploadFileForChatAnalysis(userId, file);
      
      // Добавляем сообщение в чат
      onUploadComplete(result.chatMessage);
      
      toast({
        title: "Файл загружен",
        description: "Файл успешно загружен и проанализирован",
      });
    } catch (error) {
      console.error("Ошибка при загрузке файла:", error);
      toast({
        title: "Ошибка загрузки",
        description: error instanceof Error ? error.message : "Не удалось загрузить файл",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      
      // Очистка инпута для возможности повторной загрузки того же файла
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".txt,.pdf,.doc,.docx,.xls,.xlsx,.csv"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={handleButtonClick}
        disabled={isUploading || disabled}
        title="Загрузить файл для анализа"
        type="button"
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
      </Button>
    </>
  );
}