import { useState } from "react";
import { MediaGallery } from "@/components/media/media-gallery";
import { useAuth } from "@/context/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MediaUpload } from "@/components/media/media-upload";
import { Plus, Upload, Image, FileText, Film, FileAudio } from "lucide-react";

export default function MediaLibraryPage() {
  const { user } = useAuth();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  if (!user) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Требуется авторизация</CardTitle>
            <CardDescription>
              Пожалуйста, войдите в систему для доступа к медиабиблиотеке
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <PageHeaderHeading>Медиабиблиотека</PageHeaderHeading>
            <PageHeaderDescription>
              Управляйте изображениями, видео, аудио и документами для использования в учебных материалах
            </PageHeaderDescription>
          </div>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Загрузить файл
          </Button>
        </div>
      </PageHeader>

      <Separator className="mb-8" />

      <div className="flex items-center justify-between mb-8">
        <div></div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Загрузить файл
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Загрузка медиафайла</DialogTitle>
              <DialogDescription>
                Загрузите изображения, видео, аудио или документы для использования в учебных материалах
              </DialogDescription>
            </DialogHeader>
            <MediaUpload
              userId={user.id}
              onUploadComplete={() => setUploadDialogOpen(false)}
            />
          </DialogContent>  
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="all">Все файлы</TabsTrigger>
          <TabsTrigger value="images">
            <Image className="mr-2 h-4 w-4" />
            Изображения
          </TabsTrigger>
          <TabsTrigger value="videos">
            <Film className="mr-2 h-4 w-4" />
            Видео
          </TabsTrigger>
          <TabsTrigger value="audio">
            <FileAudio className="mr-2 h-4 w-4" />
            Аудио
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="mr-2 h-4 w-4" />
            Документы
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <MediaGallery userId={user.id} />
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          <MediaGallery
            userId={user.id}
            mediaTypeFilter="image"
          />
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          <MediaGallery
            userId={user.id}
            mediaTypeFilter="video"
          />
        </TabsContent>

        <TabsContent value="audio" className="space-y-4">
          <MediaGallery
            userId={user.id}
            mediaTypeFilter="audio"
          />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <MediaGallery
            userId={user.id}
            mediaTypeFilter="document"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
