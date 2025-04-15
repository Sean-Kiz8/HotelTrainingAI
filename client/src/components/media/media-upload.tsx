import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, File, X, Check, AlertCircle, Loader2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

// Принимаем userId обязательно и опциональный callback после успешной загрузки
interface MediaUploadProps {
  userId: number;
  onUploadComplete?: (mediaFile: any) => void;
  allowedTypes?: string[]; // Массив допустимых MIME-типов
  maxFileSize?: number; // Максимальный размер файла в байтах
}

export function MediaUpload({ 
  userId, 
  onUploadComplete,
  allowedTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf'],
  maxFileSize = 50 * 1024 * 1024 // 50MB default
}: MediaUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const xhr = new XMLHttpRequest();
      
      return new Promise<any>((resolve, reject) => {
        xhr.open('POST', '/api/media/upload');
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total);
            setUploadProgress(progress);
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.message || 'Не удалось загрузить файл'));
            } catch (e) {
              reject(new Error('Неизвестная ошибка при загрузке файла'));
            }
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Ошибка сети при загрузке файла'));
        };
        
        xhr.send(formData);
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Файл успешно загружен",
        description: `Файл ${data.filename} был успешно загружен.`,
        variant: "default",
      });
      // Очистим состояние
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Инвалидируем запрос медиафайлов, чтобы обновить список
      queryClient.invalidateQueries({ queryKey: ['/api/media'] });
      
      // Вызовем колбэк, если он предоставлен
      if (onUploadComplete) {
        onUploadComplete(data);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка загрузки",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
      setError(error.message);
    },
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Проверка типа файла
      const fileType = file.type;
      const isAllowedType = allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          // Проверка по категории (image/*, video/*, etc)
          const category = type.split('/')[0];
          return fileType.startsWith(`${category}/`);
        }
        return type === fileType;
      });
      
      if (!isAllowedType) {
        setError(`Тип файла не поддерживается. Допустимые типы: ${allowedTypes.join(', ')}`);
        e.target.value = '';
        return;
      }
      
      // Проверка размера файла
      if (file.size > maxFileSize) {
        const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
        setError(`Файл слишком большой. Максимальный размер: ${maxSizeMB}MB`);
        e.target.value = '';
        return;
      }
      
      setSelectedFile(file);
    }
  };
  
  const handleUpload = () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('uploadedById', userId.toString());
    
    // Если нужно добавить метаданные
    // formData.append('metadata', JSON.stringify({ someKey: 'someValue' }));
    
    uploadMutation.mutate(formData);
  };
  
  const handleCancel = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Загрузка медиафайла</CardTitle>
        <CardDescription>
          Загрузите изображения, видео, аудио и документы для использования в курсах
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div 
            className={`border-2 border-dashed rounded-md p-6 text-center hover:bg-muted/50 transition-colors ${
              error ? 'border-destructive' : (
                selectedFile ? 'border-primary' : 'border-muted'
              )
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            {selectedFile ? (
              <div className="flex flex-col items-center">
                <File className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="font-medium text-sm">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="font-medium">Нажмите для выбора файла</p>
                <p className="text-xs text-muted-foreground">
                  или перетащите файл сюда
                </p>
              </div>
            )}
          </div>
          
          {error && (
            <div className="flex items-center text-destructive text-sm gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          
          <Input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept={allowedTypes.join(',')}
          />
          
          {uploadMutation.isPending && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Загрузка...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {selectedFile && (
          <>
            <Button 
              variant="ghost" 
              onClick={handleCancel}
              disabled={uploadMutation.isPending}
            >
              <X className="mr-2 h-4 w-4" />
              Отмена
            </Button>
            
            <Button 
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Загрузка...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Загрузить
                </>
              )}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}