import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useChatbot } from "@/context/chatbot-context";
import { useAuth } from "@/context/auth-context";
import { FileUploadButton } from "./file-upload-button";
import { Send } from "lucide-react";

export function AIChat() {
  const { 
    isOpen, 
    toggleChatbot, 
    messages, 
    sendMessage,
    isLoading,
    addMessage
  } = useChatbot();
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Suggested questions
  const suggestedQuestions = [
    "Доступные курсы",
    "Мой прогресс",
    "Помощь"
  ];
  
  // Log state for debugging
  useEffect(() => {
    console.log("AIChat rendered, isOpen:", isOpen);
  }, [isOpen]);
  
  // Scroll to bottom when messages change or when chat opens
  useEffect(() => {
    if (isOpen || messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    const userId = user?.id || 1;
    sendMessage(inputValue, userId);
    setInputValue("");
  };
  
  const handleSuggestedQuestion = (question: string) => {
    const userId = user?.id || 1;
    sendMessage(question, userId);
  };
  
  return (
    <div 
      className={cn(
        "chat-window fixed bottom-0 right-0 md:right-6 z-20 w-full sm:w-80 flex flex-col transform transition-all duration-300",
        isOpen ? "translate-y-0 opacity-100" : "translate-y-[30rem] opacity-0 pointer-events-none"
      )}
    >
      <div 
        className="bg-primary text-white p-3 rounded-t-lg flex items-center justify-between cursor-pointer"
        onClick={toggleChatbot}
      >
        <div className="flex items-center">
          <span className="material-icons mr-2">smart_toy</span>
          <h3 className="font-sans font-medium">Ассистент обучения</h3>
        </div>
        <button className="text-white focus:outline-none">
          <span className="material-icons chatbot-toggle-icon">
            {isOpen ? "expand_more" : "expand_less"}
          </span>
        </button>
      </div>
      <div className="bg-white border border-neutral-200 border-t-0 flex flex-col h-96 rounded-b-lg overflow-hidden shadow-lg">
        <div className="flex-1 p-3 overflow-y-auto" id="chatMessages">
          {messages.map((message, index) => (
            <div key={index}>
              {message.message !== "Приветствие" && (
                <div className="flex items-start justify-end mb-3">
                  <div className="bg-neutral-100 p-2 rounded-lg rounded-tr-none max-w-[85%]">
                    <p className="text-sm">{message.message}</p>
                  </div>
                </div>
              )}
              
              {message.response && (
                <div className="flex items-start mb-3">
                  <div className="bg-primary text-white p-2 rounded-lg rounded-tl-none max-w-[85%]">
                    <p className="text-sm whitespace-pre-wrap">{message.response}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start mb-3">
              <div className="bg-primary text-white p-2 rounded-lg rounded-tl-none">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="border-t border-neutral-200 p-3">
          <form onSubmit={handleSendMessage} className="flex">
            <div className="flex items-center bg-background rounded-l-md border border-r-0 border-input pl-2">
              <FileUploadButton 
                userId={user?.id || 1} 
                onUploadComplete={(chatMessage) => {
                  // Используем контекст чатбота для добавления сообщения
                  const userId = user?.id || 1;
                  const fileMessage = { 
                    ...chatMessage,
                    userId 
                  };
                  
                  // Добавляем сообщение через контекст чат-бота
                  addMessage(fileMessage);
                }}
                disabled={isLoading}
              />
            </div>
            <Input
              type="text"
              placeholder="Введите ваш вопрос..."
              className="flex-1 rounded-none border-l-0"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Button 
              type="submit"
              className="bg-primary text-white rounded-l-none" 
              disabled={!inputValue.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <div className="mt-2 flex flex-wrap gap-1">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                className="bg-neutral-100 text-neutral-700 text-xs px-2 py-1 rounded-full hover:bg-neutral-200"
                onClick={() => handleSuggestedQuestion(question)}
                disabled={isLoading}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
