import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText,
  FileImage,
  File,
  UploadCloud,
  X,
  AlertCircle,
  Trash,
  Check
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { UploadedFile } from "./smart-course-creator";
import { useToast } from "@/hooks/use-toast";

// Вспомогательная функция для генерации уникального ID
const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

interface Step1FileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}

export function Step1FileUpload({ files, onFilesChange }: Step1FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  // Функция для получения иконки файла в зависимости от его типа
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileText className="h-6 w-6 text-red-500" />;
    } else if (fileType.includes('image')) {
      return <FileImage className="h-6 w-6 text-blue-500" />;
    } else if (fileType.includes('word') || fileType.includes('doc')) {
      return <FileText className="h-6 w-6 text-blue-700" />;
    } else if (fileType.includes('zip') || fileType.includes('archive')) {
      return <File className="h-6 w-6 text-yellow-600" />;
    } else {
      return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  // Размер файла в читаемом формате
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Загрузка файлов
  const uploadFile = async (file: File) => {
    // Создаем объект FormData для загрузки файла
    const formData = new FormData();
    formData.append('file', file);

    // Создаем временный объект файла для отображения прогресса загрузки
    const tempFile: UploadedFile = {
      id: generateUniqueId(),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      status: 'uploading',
      progress: 0
    };

    // Добавляем временный файл в список
    onFilesChange([...files, tempFile]);

    try {
      // Отправляем запрос на сервер
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      
      // Обновляем список файлов с полученными данными от сервера
      onFilesChange(files.map(f => 
        f.id === tempFile.id 
          ? { 
              ...f, 
              id: result.id.toString(), // ID файла в базе данных
              status: 'completed',
              progress: 100
            } 
          : f
      ));

      toast({
        title: "Файл загружен",
        description: `${file.name} успешно загружен`,
        variant: "default",
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      
      // Обновляем статус файла на ошибку
      onFilesChange(files.map(f => 
        f.id === tempFile.id 
          ? { 
              ...f, 
              status: 'error',
              error: error instanceof Error ? error.message : 'Ошибка загрузки файла'
            } 
          : f
      ));

      toast({
        title: "Ошибка загрузки",
        description: error instanceof Error ? error.message : 'Ошибка загрузки файла',
        variant: "destructive",
      });
    }
  };

  // Обработчики перетаскивания файлов
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileList = Array.from(e.dataTransfer.files);
      
      // Ограничение на количество файлов
      if (files.length + fileList.length > 10) {
        toast({
          title: "Превышен лимит файлов",
          description: "Можно загрузить максимум 10 файлов",
          variant: "destructive",
        });
        return;
      }
      
      // Последовательная загрузка файлов
      for (const file of fileList) {
        await uploadFile(file);
      }
    }
  };

  // Обработчик добавления файлов через диалоговое окно
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      
      // Ограничение на количество файлов
      if (files.length + fileList.length > 10) {
        toast({
          title: "Превышен лимит файлов",
          description: "Можно загрузить максимум 10 файлов",
          variant: "destructive",
        });
        return;
      }
      
      // Последовательная загрузка файлов
      for (const file of fileList) {
        await uploadFile(file);
      }
    }
  };

  // Удаление файла
  const handleRemoveFile = (fileId: string) => {
    onFilesChange(files.filter(f => f.id !== fileId));
  };

  return (
    <div className="space-y-6">
      <div 
        className={`
          border-2 border-dashed rounded-lg p-8 text-center
          ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'}
          transition-colors
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <UploadCloud className="h-12 w-12 text-gray-400" />
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Перетащите файлы сюда или нажмите для выбора</h3>
            <p className="text-sm text-muted-foreground">
              Поддерживаемые форматы: PDF, DOCX, TXT, JPG, PNG, PPT
            </p>
            <p className="text-sm text-muted-foreground">
              Максимальный размер файла: 50 MB
            </p>
          </div>
          <Button variant="secondary" onClick={() => document.getElementById('fileInput')?.click()}>
            Выбрать файлы
          </Button>
          <input 
            id="fileInput"
            type="file" 
            multiple 
            className="hidden" 
            onChange={handleFileInputChange}
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.ppt,.pptx"
          />
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Загруженные файлы ({files.length}/10)</h3>
            {files.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onFilesChange([])}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash className="h-4 w-4 mr-1" />
                Удалить все
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {files.map(file => (
              <Card key={file.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center p-3">
                    <div className="mr-3">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-medium truncate" title={file.name}>
                          {file.name}
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0 ml-1"
                          onClick={() => handleRemoveFile(file.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <span className="mr-2">{formatFileSize(file.size)}</span>
                        
                        {file.status === 'completed' && (
                          <Badge variant="outline" className="flex items-center bg-green-50 text-green-700 border-green-200">
                            <Check className="h-3 w-3 mr-1" />
                            Загружен
                          </Badge>
                        )}
                        
                        {file.status === 'error' && (
                          <Badge variant="outline" className="flex items-center bg-red-50 text-red-700 border-red-200">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Ошибка
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {file.status === 'uploading' && (
                    <div className="px-3 pb-3">
                      <Progress 
                        value={file.progress} 
                        className="h-1" 
                      />
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        {file.progress}%
                      </p>
                    </div>
                  )}
                  
                  {file.status === 'error' && file.error && (
                    <div className="px-3 pb-3">
                      <p className="text-xs text-red-500">{file.error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}