import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MediaFile } from "@shared/schema";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertCircle, Search, Filter, Trash2, Download, Eye, Plus, 
  Play, Music, File, MoreVertical, Check, X
} from "lucide-react";
import { MediaUpload } from "./media-upload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MediaGalleryProps {
  userId: number;
  selectable?: boolean;
  onSelect?: (mediaFile: MediaFile) => void;
  mediaTypeFilter?: string;
}

export function MediaGallery({ userId, selectable = false, onSelect, mediaTypeFilter: initialMediaTypeFilter }: MediaGalleryProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string | null>(initialMediaTypeFilter || null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  
  // Получаем список медиафайлов с поддержкой фильтрации
  const mediaQuery = useQuery<MediaFile[]>({
    queryKey: ['/api/media', mediaTypeFilter],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (mediaId: number) => {
      const response = await apiRequest("DELETE", `/api/media/${mediaId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Медиафайл удален",
        description: "Файл был успешно удален из системы",
        variant: "default",
      });
      // Обновляем список медиафайлов
      mediaQuery.refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка удаления",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Фильтруем и сортируем список медиафайлов
  const filteredMedia = (mediaQuery.data || [])
    .filter(media => {
      // Фильтрация по типу медиа
      if (mediaTypeFilter && media.mediaType !== mediaTypeFilter) {
        return false;
      }
      
      // Фильтрация по поисковому запросу (по имени файла)
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        return (
          media.filename.toLowerCase().includes(query) || 
          (media.originalFilename && media.originalFilename.toLowerCase().includes(query))
        );
      }
      
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const handleMediaSelect = (media: MediaFile) => {
    if (selectable && onSelect) {
      onSelect(media);
    } else {
      setSelectedMedia(media);
      setPreviewDialogOpen(true);
    }
  };
  
  const handleDeleteMedia = (mediaId: number) => {
    if (confirm("Вы уверены, что хотите удалить этот файл? Это действие нельзя отменить.")) {
      deleteMutation.mutate(mediaId);
    }
  };
  
  const handleDownloadMedia = (media: MediaFile) => {
    const a = document.createElement('a');
    a.href = media.url;
    a.download = media.originalFilename || media.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  // Функция для определения, можно ли просмотреть файл в браузере
  const isPreviewable = (media: MediaFile) => {
    return media.mediaType === 'image' || 
           media.mediaType === 'video' || 
           media.mediaType === 'audio' || 
           media.mimeType === 'application/pdf';
  };
  
  // Функция для рендеринга медиа-превью
  const renderMediaPreview = (media: MediaFile) => {
    switch(media.mediaType) {
      case 'image':
        return <img 
          src={media.url}
          alt={media.originalFilename || media.filename}
          className="w-full h-40 object-contain bg-muted rounded-md"
          onClick={() => handleMediaSelect(media)}
        />;
        
      case 'video':
        return (
          <div 
            className="relative w-full h-40 bg-muted rounded-md"
            onClick={() => handleMediaSelect(media)}
          >
            <video 
              src={media.url}
              className="w-full h-full object-contain"
              poster={media.thumbnail || undefined}
              controls={false}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black bg-opacity-50 rounded-full p-3">
                <Play className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        );
        
      case 'audio':
        return (
          <div 
            className="w-full h-40 bg-muted rounded-md flex items-center justify-center"
            onClick={() => handleMediaSelect(media)}
          >
            <div className="text-center">
              <Music className="w-12 h-12 mx-auto text-primary" />
              <p className="mt-2 text-sm">{media.originalFilename || media.filename}</p>
            </div>
          </div>
        );
        
      default:
        return (
          <div 
            className="w-full h-40 bg-muted rounded-md flex items-center justify-center"
            onClick={() => handleMediaSelect(media)}
          >
            <div className="text-center">
              <File className="w-12 h-12 mx-auto text-primary" />
              <p className="mt-2 text-sm truncate max-w-[200px]">
                {media.originalFilename || media.filename}
              </p>
            </div>
          </div>
        );
    }
  };
  
  // Функция для рендеринга полноразмерного предпросмотра
  const renderFullPreview = (media: MediaFile | null) => {
    if (!media) return null;
    
    switch(media.mediaType) {
      case 'image':
        return <img 
          src={media.url}
          alt={media.originalFilename || media.filename}
          className="max-w-full max-h-[70vh] object-contain mx-auto"
        />;
        
      case 'video':
        return <video 
          src={media.url}
          className="max-w-full max-h-[70vh]"
          controls
          autoPlay={false}
        />;
        
      case 'audio':
        return <audio 
          src={media.url}
          className="w-full"
          controls
          autoPlay={false}
        />;
        
      case 'document':
        if (media.mimeType === 'application/pdf') {
          return <iframe 
            src={`${media.url}#view=FitH`}
            className="w-full h-[70vh] border-0"
          />;
        }
        return (
          <div className="text-center py-10">
            <File className="w-16 h-16 mx-auto text-primary mb-4" />
            <p>Предпросмотр недоступен для данного типа файла.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => handleDownloadMedia(media)}
            >
              <Download className="mr-2 h-4 w-4" />
              Скачать файл
            </Button>
          </div>
        );
        
      default:
        return (
          <div className="text-center py-10">
            <File className="w-16 h-16 mx-auto text-primary mb-4" />
            <p>Предпросмотр недоступен для данного типа файла.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => handleDownloadMedia(media)}
            >
              <Download className="mr-2 h-4 w-4" />
              Скачать файл
            </Button>
          </div>
        );
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени файла..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select
          value={mediaTypeFilter || ""}
          onValueChange={(value) => setMediaTypeFilter(value || null)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Тип файла" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Все типы</SelectItem>
            <SelectItem value="image">Изображения</SelectItem>
            <SelectItem value="video">Видео</SelectItem>
            <SelectItem value="audio">Аудио</SelectItem>
            <SelectItem value="document">Документы</SelectItem>
            <SelectItem value="presentation">Презентации</SelectItem>
          </SelectContent>
        </Select>
        
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Загрузить файл
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Загрузка нового файла</DialogTitle>
              <DialogDescription>
                Загрузите медиафайл для использования в учебных материалах
              </DialogDescription>
            </DialogHeader>
            <MediaUpload 
              userId={userId}
              onUploadComplete={() => setUploadDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      {mediaQuery.isLoading ? (
        <div className="flex justify-center items-center h-60">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Загрузка медиафайлов...</p>
          </div>
        </div>
      ) : mediaQuery.error ? (
        <div className="flex justify-center items-center h-60">
          <div className="flex flex-col items-center text-destructive">
            <AlertCircle className="h-12 w-12" />
            <p className="mt-4">Не удалось загрузить медиафайлы</p>
            <Button 
              variant="outline" 
              onClick={() => mediaQuery.refetch()}
              className="mt-2"
            >
              Попробовать снова
            </Button>
          </div>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="flex justify-center items-center h-60 border-2 border-dashed rounded-md">
          <div className="flex flex-col items-center text-muted-foreground">
            <File className="h-12 w-12" />
            <p className="mt-4">Нет доступных медиафайлов</p>
            <p className="text-sm">Загрузите файлы, чтобы они отобразились здесь</p>
            <Button 
              variant="outline" 
              onClick={() => setUploadDialogOpen(true)}
              className="mt-4"
            >
              Загрузить файл
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedia.map((media) => (
            <Card key={media.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative group">
                  {renderMediaPreview(media)}
                  
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isPreviewable(media) && (
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedMedia(media);
                              setPreviewDialogOpen(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Просмотреть
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDownloadMedia(media)}>
                          <Download className="mr-2 h-4 w-4" />
                          Скачать
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteMedia(media.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="p-3">
                  <p className="font-medium truncate" title={media.originalFilename || media.filename}>
                    {media.originalFilename || media.filename}
                  </p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-muted-foreground">
                      {new Date(media.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {media.mediaType}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedMedia?.originalFilename || selectedMedia?.filename}</DialogTitle>
            <DialogDescription>
              Загружен: {selectedMedia && new Date(selectedMedia.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {renderFullPreview(selectedMedia)}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => selectedMedia && handleDownloadMedia(selectedMedia)}
            >
              <Download className="mr-2 h-4 w-4" />
              Скачать файл
            </Button>
            
            {selectable && onSelect && (
              <Button 
                onClick={() => {
                  if (selectedMedia && onSelect) {
                    onSelect(selectedMedia);
                    setPreviewDialogOpen(false);
                  }
                }}
              >
                <Check className="mr-2 h-4 w-4" />
                Выбрать файл
              </Button>
            )}
            
            <DialogClose asChild>
              <Button variant="ghost">
                <X className="mr-2 h-4 w-4" />
                Закрыть
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}