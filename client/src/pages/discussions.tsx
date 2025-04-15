import { useState } from "react";
import { PageHeader, SearchInput, CreateButton } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { useChatbot } from "@/context/chatbot-context";

// Sample discussion topics (in a real app these would come from the API)
const sampleDiscussions = [
  {
    id: 1,
    title: "Как улучшить навыки общения с гостями?",
    content: "Хотелось бы узнать о лучших практиках общения с гостями, особенно в сложных ситуациях, когда гость недоволен. Какие техники вы используете для деэскалации конфликтов?",
    author: {
      id: 2,
      name: "Анна Петрова",
      avatar: "",
      role: "Администратор ресепшн"
    },
    timestamp: "2023-12-15T14:30:00",
    department: "Ресепшн",
    replies: 5,
    views: 32,
    tags: ["общение", "гости", "конфликты"]
  },
  {
    id: 2,
    title: "Вопрос по курсу 'Стандарты обслуживания номеров'",
    content: "В курсе упоминаются стандарты заправки кроватей, но не очень понятно, как именно располагать декоративные подушки. Есть ли какая-то схема или руководство по этому вопросу?",
    author: {
      id: 3,
      name: "Михаил Иванов",
      avatar: "",
      role: "Обслуживание номеров"
    },
    timestamp: "2023-12-14T09:15:00",
    department: "Обслуживание номеров",
    replies: 3,
    views: 18,
    tags: ["курсы", "стандарты", "номера"]
  },
  {
    id: 3,
    title: "Рекомендации по адаптации новых сотрудников",
    content: "Коллеги, поделитесь опытом по адаптации новых сотрудников в ресторане. Какие практики вы считаете наиболее эффективными? Как быстрее ввести нового человека в курс дела?",
    author: {
      id: 4,
      name: "Ольга Смирнова",
      avatar: "",
      role: "Менеджер ресторана"
    },
    timestamp: "2023-12-10T16:45:00",
    department: "Ресторан",
    replies: 8,
    views: 45,
    tags: ["адаптация", "ресторан", "обучение"]
  }
];

interface DiscussionCardProps {
  id: number;
  title: string;
  content: string;
  author: {
    id: number;
    name: string;
    avatar: string;
    role: string;
  };
  timestamp: string;
  department: string;
  replies: number;
  views: number;
  tags: string[];
  onClick: () => void;
}

function DiscussionCard({
  id,
  title,
  content,
  author,
  timestamp,
  department,
  replies,
  views,
  tags,
  onClick,
}: DiscussionCardProps) {
  // Format date
  const formattedDate = new Date(timestamp).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  
  // Truncate content for preview
  const truncatedContent = content.length > 150 
    ? content.substring(0, 150) + '...' 
    : content;
  
  // Map department to badge color
  const getBadgeColor = (dept: string) => {
    switch (dept) {
      case "Обслуживание номеров":
        return "bg-primary-light text-primary";
      case "Ресторан":
        return "bg-secondary-light text-secondary";
      case "Ресепшн":
        return "bg-accent-light text-accent";
      case "Адаптация":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-neutral-200 text-neutral-700";
    }
  };
  
  return (
    <Card className="mb-4 hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Avatar className="h-9 w-9 mr-2">
              <AvatarImage src={author.avatar} alt={author.name} />
              <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{author.name}</p>
              <p className="text-xs text-neutral-500">{author.role}</p>
            </div>
          </div>
          <Badge className={getBadgeColor(department)}>{department}</Badge>
        </div>
        
        <h3 className="font-medium text-lg mb-2 hover:text-primary cursor-pointer" onClick={onClick}>
          {title}
        </h3>
        <p className="text-neutral-600 text-sm mb-3">{truncatedContent}</p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="flex justify-between items-center text-sm text-neutral-500">
          <span>{formattedDate}</span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="material-icons text-sm mr-1">comment</span>
              <span>{replies}</span>
            </div>
            <div className="flex items-center">
              <span className="material-icons text-sm mr-1">visibility</span>
              <span>{views}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DiscussionDetail({ discussion, onBack }: { discussion: any, onBack: () => void }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [reply, setReply] = useState("");
  const { openChatbot } = useChatbot();

  const formattedDate = new Date(discussion.timestamp).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleSubmitReply = () => {
    if (!reply.trim()) return;
    
    toast({
      title: "Ответ отправлен",
      description: "Ваш ответ был успешно добавлен в обсуждение",
    });
    
    setReply("");
  };

  const handleAskAI = () => {
    openChatbot();
    toast({
      title: "Чат с ИИ открыт",
      description: "Задайте ваш вопрос ассистенту обучения",
    });
  };

  return (
    <div>
      <Button variant="ghost" className="mb-4" onClick={onBack}>
        <span className="material-icons text-sm mr-1">arrow_back</span>
        Назад к обсуждениям
      </Button>
      
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarImage src={discussion.author.avatar} alt={discussion.author.name} />
                <AvatarFallback>{discussion.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{discussion.author.name}</p>
                <p className="text-xs text-neutral-500">{discussion.author.role} • {formattedDate}</p>
              </div>
            </div>
            <Badge>{discussion.department}</Badge>
          </div>
          <CardTitle className="text-xl mt-2">{discussion.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-700 whitespace-pre-line">{discussion.content}</p>
          
          <div className="flex flex-wrap gap-1 mt-4">
            {discussion.tags.map((tag: string, index: number) => (
              <Badge key={index} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <div className="flex items-center space-x-4 text-sm text-neutral-500">
            <div className="flex items-center">
              <span className="material-icons text-sm mr-1">comment</span>
              <span>{discussion.replies} ответов</span>
            </div>
            <div className="flex items-center">
              <span className="material-icons text-sm mr-1">visibility</span>
              <span>{discussion.views} просмотров</span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleAskAI}>
            <span className="material-icons text-sm mr-1">smart_toy</span>
            Спросить ИИ
          </Button>
        </CardFooter>
      </Card>
      
      {/* Reply form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Оставить ответ</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Напишите ваш ответ..."
            className="min-h-[100px]"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSubmitReply} disabled={!reply.trim()}>
            <span className="material-icons text-sm mr-1">send</span>
            Отправить
          </Button>
        </CardFooter>
      </Card>
      
      {/* Replies */}
      <h3 className="font-sans font-semibold text-lg mb-4">Ответы ({discussion.replies})</h3>
      
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start">
              <Avatar className="h-8 w-8 mr-3 mt-1">
                <AvatarFallback>E</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">Елена Смирнова</p>
                    <p className="text-xs text-neutral-500">Тренинг-менеджер • 2 дня назад</p>
                  </div>
                </div>
                <p className="text-sm mt-2">
                  Спасибо за вопрос! В нашей гостинице есть специальная схема расположения декоративных подушек. 
                  Я прикреплю материалы к ответу. Также рекомендую посмотреть раздел 3.2 курса, там есть видео с демонстрацией.
                </p>
                <div className="mt-3 flex items-center space-x-3 text-xs">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    <span className="material-icons text-xs mr-1">thumb_up</span>
                    Полезно (3)
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    <span className="material-icons text-xs mr-1">reply</span>
                    Ответить
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start">
              <Avatar className="h-8 w-8 mr-3 mt-1">
                <AvatarFallback>А</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">Александр Петров</p>
                    <p className="text-xs text-neutral-500">Обслуживание номеров • 1 день назад</p>
                  </div>
                </div>
                <p className="text-sm mt-2">
                  Я работаю в обслуживании номеров уже 2 года, могу подсказать. Обычно мы ставим большие подушки к изголовью, 
                  а декоративные выставляем перед ними, создавая каскад. Цветные подушки должны сочетаться с общим стилем номера.
                </p>
                <div className="mt-3 flex items-center space-x-3 text-xs">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    <span className="material-icons text-xs mr-1">thumb_up</span>
                    Полезно (1)
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    <span className="material-icons text-xs mr-1">reply</span>
                    Ответить
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Discussions() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscussion, setSelectedDiscussion] = useState<any>(null);
  
  // Filter discussions by search query
  const filteredDiscussions = sampleDiscussions.filter(
    discussion =>
      discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      discussion.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      discussion.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      discussion.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const handleCreateDiscussion = () => {
    toast({
      title: "Создание обсуждения",
      description: "Функциональность находится в разработке",
    });
  };
  
  const handleViewDiscussion = (discussion: any) => {
    setSelectedDiscussion(discussion);
    window.scrollTo(0, 0);
  };
  
  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      {selectedDiscussion ? (
        <DiscussionDetail 
          discussion={selectedDiscussion} 
          onBack={() => setSelectedDiscussion(null)} 
        />
      ) : (
        <>
          <PageHeader title="Обсуждения">
            <SearchInput
              placeholder="Поиск обсуждений..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
            <CreateButton 
              label="Создать обсуждение" 
              onClick={handleCreateDiscussion} 
            />
          </PageHeader>
          
          <Tabs defaultValue="all" className="mb-6">
            <TabsList>
              <TabsTrigger value="all">Все</TabsTrigger>
              <TabsTrigger value="reception">Ресепшн</TabsTrigger>
              <TabsTrigger value="restaurant">Ресторан</TabsTrigger>
              <TabsTrigger value="housekeeping">Обслуживание номеров</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              {filteredDiscussions.length > 0 ? (
                filteredDiscussions.map(discussion => (
                  <DiscussionCard
                    key={discussion.id}
                    {...discussion}
                    onClick={() => handleViewDiscussion(discussion)}
                  />
                ))
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  {searchQuery ? (
                    <p>Обсуждения по запросу "{searchQuery}" не найдены</p>
                  ) : (
                    <p>Нет доступных обсуждений</p>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="reception" className="mt-4">
              {filteredDiscussions
                .filter(discussion => discussion.department === "Ресепшн")
                .map(discussion => (
                  <DiscussionCard
                    key={discussion.id}
                    {...discussion}
                    onClick={() => handleViewDiscussion(discussion)}
                  />
                ))}
              
              {filteredDiscussions.filter(discussion => discussion.department === "Ресепшн").length === 0 && (
                <div className="text-center py-12 text-neutral-500">
                  <p>Нет обсуждений для отдела "Ресепшн"</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="restaurant" className="mt-4">
              {filteredDiscussions
                .filter(discussion => discussion.department === "Ресторан")
                .map(discussion => (
                  <DiscussionCard
                    key={discussion.id}
                    {...discussion}
                    onClick={() => handleViewDiscussion(discussion)}
                  />
                ))}
              
              {filteredDiscussions.filter(discussion => discussion.department === "Ресторан").length === 0 && (
                <div className="text-center py-12 text-neutral-500">
                  <p>Нет обсуждений для отдела "Ресторан"</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="housekeeping" className="mt-4">
              {filteredDiscussions
                .filter(discussion => discussion.department === "Обслуживание номеров")
                .map(discussion => (
                  <DiscussionCard
                    key={discussion.id}
                    {...discussion}
                    onClick={() => handleViewDiscussion(discussion)}
                  />
                ))}
              
              {filteredDiscussions.filter(discussion => discussion.department === "Обслуживание номеров").length === 0 && (
                <div className="text-center py-12 text-neutral-500">
                  <p>Нет обсуждений для отдела "Обслуживание номеров"</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {/* Recommended Discussions */}
          <div className="mt-8">
            <h3 className="font-sans font-semibold text-lg mb-4">Рекомендуемые обсуждения</h3>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-icons text-primary text-2xl">lightbulb</span>
                  <h4 className="font-medium text-lg">Советы по обучению от опытных сотрудников</h4>
                </div>
                <p className="text-neutral-600 mb-3">
                  В этом обсуждении собраны советы и рекомендации от опытных сотрудников, которые помогут вам быстрее освоить новые навыки и стать профессионалом.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => toast({
                    title: "Рекомендуемые обсуждения",
                    description: "Функциональность находится в разработке",
                  })}
                >
                  Перейти к обсуждению
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
