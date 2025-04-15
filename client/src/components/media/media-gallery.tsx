import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaFile as DBMediaFile } from "@shared/schema";
import { Search } from "lucide-react";

// Пользовательский тип для работы с медиа-файлами
interface MediaFile extends DBMediaFile {
  name: string; // Алиас для originalFilename
}

interface MediaGalleryProps {
  userId?: number;
  mediaTypeFilter?: string;
  selectable?: boolean;
  onSelect?: (mediaFile: MediaFile) => void;
}

export function MediaGallery({
  userId,
  mediaTypeFilter,
  selectable = false,
  onSelect
}: MediaGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Получаем все медиафайлы
  const { data: rawMediaFiles = [], isLoading } = useQuery<DBMediaFile[]>({
    queryKey: ["/api/media", { mediaType: mediaTypeFilter }],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Добавляем виртуальное поле name
  const mediaFiles: MediaFile[] = rawMediaFiles.map(file => ({
    ...file,
    name: file.originalFilename
  }));
  
  // Фильтруем файлы по поисковому запросу
  const filteredFiles = mediaFiles.filter(file => 
    file.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (file.metadata && typeof file.metadata === 'object' && 
      'description' in file.metadata && 
      typeof file.metadata.description === 'string' && 
      file.metadata.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Если передан тип медиа, фильтруем по нему
  const typeFilteredFiles = mediaTypeFilter 
    ? filteredFiles.filter(file => file.mediaType === mediaTypeFilter)
    : filteredFiles;
  
  // Обработчик выбора файла
  const handleSelect = (file: MediaFile) => {
    if (selectable && onSelect) {
      onSelect(file);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <Input
          type="search"
          placeholder="Поиск медиафайлов..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-md" />
          ))}
        </div>
      ) : typeFilteredFiles.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {typeFilteredFiles.map((file) => (
            <Card 
              key={file.id} 
              className={`overflow-hidden ${selectable ? 'cursor-pointer hover:ring-2 hover:ring-primary/50' : ''}`}
              onClick={() => handleSelect(file)}
            >
              <CardContent className="p-0">
                {file.mediaType === 'image' ? (
                  <div className="aspect-square relative">
                    <img 
                      src={file.thumbnail || file.url} 
                      alt={file.originalFilename}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs truncate">{file.originalFilename}</p>
                    </div>
                  </div>
                ) : file.mediaType === 'video' ? (
                  <div className="aspect-square relative bg-muted flex items-center justify-center">
                    <span className="material-icons text-3xl">movie</span>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs truncate">{file.originalFilename}</p>
                    </div>
                  </div>
                ) : file.mediaType === 'audio' ? (
                  <div className="aspect-square relative bg-muted flex items-center justify-center">
                    <span className="material-icons text-3xl">audio_file</span>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs truncate">{file.originalFilename}</p>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square relative bg-muted flex items-center justify-center">
                    <span className="material-icons text-3xl">description</span>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs truncate">{file.originalFilename}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>Медиафайлы не найдены</p>
          {searchQuery && (
            <p className="mt-2">Попробуйте изменить поисковый запрос</p>
          )}
        </div>
      )}
    </div>
  );
}