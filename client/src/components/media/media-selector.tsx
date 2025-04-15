import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MediaGallery } from "./media-gallery";
import { useAuth } from "@/context/auth-context";
import { MediaFile as DBMediaFile } from "@shared/schema";

// Пользовательский тип для работы с медиа-файлами
interface MediaFile extends DBMediaFile {
  name: string; // Алиас для originalFilename
}

interface MediaSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mediaFile: MediaFile) => void;
  mediaTypeFilter?: string;
  title?: string;
}

export function MediaSelector({
  isOpen,
  onClose,
  onSelect,
  mediaTypeFilter = "image",
  title = "Выберите медиафайл"
}: MediaSelectorProps) {
  const { user } = useAuth();
  
  const handleSelect = (mediaFile: MediaFile) => {
    onSelect(mediaFile);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          <MediaGallery 
            userId={user?.id || 1}
            mediaTypeFilter={mediaTypeFilter}
            selectable
            onSelect={handleSelect}
          />
        </div>
        
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}