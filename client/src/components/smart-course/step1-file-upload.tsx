import { useState } from "react";
import { Upload, FileX, FilePlus, FileText, FileImage, FileArchive } from "lucide-react";
import { UploadedFile } from "./smart-course-creator";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";
import { Label } from "@/components/ui/label";

interface Step1FileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}

export function Step1FileUpload({ files, onFilesChange }: Step1FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = (newFiles: File[]) => {
    const fileUpdates = newFiles.map(file => {
      const id = uuidv4();
      
      // Создаем объект нового файла
      const fileObj: UploadedFile = {
        id,
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        status: 'uploading',
        progress: 0
      };

      // Имитируем загрузку файла
      simulateFileUpload(id, file);
      
      return fileObj;
    });

    onFilesChange([...files, ...fileUpdates]);
  };

  const simulateFileUpload = (fileId: string, file: File) => {
    // Здесь будет реальная загрузка файла на сервер
    // Пока что имитируем процесс загрузки
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      
      // Обновляем прогресс текущего файла
      onFilesChange(
        files.map(f => 
          f.id === fileId 
            ? { ...f, progress, status: progress < 100 ? 'uploading' : 'completed' } 
            : f
        )
      );
      
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 300);
  };

  const removeFile = (fileId: string) => {
    onFilesChange(files.filter(file => file.id !== fileId));
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return <FileImage className="h-6 w-6 text-blue-500" />;
    if (fileType.includes('pdf')) return <FileText className="h-6 w-6 text-red-500" />;
    if (fileType.includes('zip') || fileType.includes('compressed')) return <FileArchive className="h-6 w-6 text-yellow-500" />;
    return <FileText className="h-6 w-6 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-lg font-medium mb-2">Загрузка учебных материалов</Label>
        <p className="text-sm text-muted-foreground mb-6">
          Загрузите документы, презентации, PDF-файлы или ссылки для автоматического создания курса
        </p>
      </div>
      
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragging ? "border-primary bg-primary/5" : "border-gray-300"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium">Перетащите файлы сюда</h3>
        <p className="text-sm text-muted-foreground mb-3">
          или нажмите на кнопку, чтобы выбрать файлы
        </p>
        <div>
          <label>
            <Button variant="secondary">
              <FilePlus className="h-4 w-4 mr-2" /> Выбрать файлы
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md"
              />
            </Button>
          </label>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Поддерживаемые форматы: PDF, DOCX, PPTX, TXT и другие текстовые форматы
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Загруженные файлы</h3>
          <div className="space-y-3">
            {files.map((file) => (
              <Card key={file.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file.type)}
                      <div>
                        <p className="font-medium truncate max-w-xs">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      {file.status === 'uploading' && (
                        <span className="text-xs text-muted-foreground mr-2">
                          {file.progress}%
                        </span>
                      )}
                      {file.status === 'completed' && (
                        <span className="text-xs text-green-500 mr-2">
                          Загружено
                        </span>
                      )}
                      {file.status === 'error' && (
                        <span className="text-xs text-red-500 mr-2">
                          Ошибка
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(file.id)}
                      >
                        <FileX className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  
                  {file.status === 'uploading' && (
                    <Progress
                      value={file.progress}
                      className="h-1 mt-2"
                    />
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