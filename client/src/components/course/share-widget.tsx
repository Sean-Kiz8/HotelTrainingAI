import { useState } from "react";
import { Check, Copy, Link, Mail, Share } from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface ShareWidgetProps {
  courseId: number;
  courseTitle: string;
}

export function ShareWidget({ courseId, courseTitle }: ShareWidgetProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  
  // Формируем ссылку на курс
  const courseLink = `${window.location.origin}/course-details/${courseId}`;
  
  // Обработчик копирования ссылки
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(courseLink);
      setCopied(true);
      
      toast({
        title: "Ссылка скопирована",
        description: "Вы можете поделиться ею с коллегами",
      });
      
      // Сбрасываем состояние через 2 секунды
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Ошибка копирования",
        description: "Не удалось скопировать ссылку",
        variant: "destructive",
      });
    }
  };
  
  // Обработчик отправки по email
  const handleSendEmail = () => {
    if (!email || !email.includes('@')) {
      toast({
        title: "Некорректный email",
        description: "Пожалуйста, введите правильный email адрес",
        variant: "destructive",
      });
      return;
    }
    
    // В реальном приложении здесь был бы API запрос
    // Имитируем успешную отправку
    toast({
      title: "Приглашение отправлено",
      description: `Приглашение на курс "${courseTitle}" отправлено на ${email}`,
    });
    
    // Сбрасываем поле и закрываем popover
    setEmail("");
    setOpen(false);
  };
  
  const handleShareToSocial = (platform: string) => {
    let shareUrl = "";
    
    switch (platform) {
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(courseLink)}&text=${encodeURIComponent(`Приглашаю на курс: ${courseTitle}`)}`;
        break;
      case "whatsapp":
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Приглашаю на курс: ${courseTitle} ${courseLink}`)}`;
        break;
      default:
        return;
    }
    
    // Открываем в новом окне
    window.open(shareUrl, "_blank");
    
    // Закрываем popover
    setOpen(false);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
        >
          <Share className="h-4 w-4" />
          Поделиться
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Поделиться курсом</h4>
          <Tabs defaultValue="link">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link">Ссылка</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>
            
            <TabsContent value="link" className="space-y-4">
              <div className="flex mt-2">
                <Input 
                  value={courseLink}
                  readOnly
                  className="rounded-r-none"
                />
                <Button
                  className="rounded-l-none px-3"
                  variant="secondary"
                  onClick={handleCopyLink}
                >
                  {copied ? 
                    <Check className="h-4 w-4" /> : 
                    <Copy className="h-4 w-4" />
                  }
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="text-xs" 
                  size="sm"
                  onClick={() => handleShareToSocial("telegram")}
                >
                  <span className="mr-2">Telegram</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="text-xs" 
                  size="sm"
                  onClick={() => handleShareToSocial("whatsapp")}
                >
                  <span className="mr-2">WhatsApp</span>
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="email" className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Введите email адрес"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button 
                  className="w-full"
                  onClick={handleSendEmail}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Отправить приглашение
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </PopoverContent>
    </Popover>
  );
}