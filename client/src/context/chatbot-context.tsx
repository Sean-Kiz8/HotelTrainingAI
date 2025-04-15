import { createContext, useContext, useState, useRef, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./auth-context";
import type { ChatMessage } from "@shared/schema";

interface ChatbotContextType {
  isOpen: boolean;
  toggleChatbot: () => void;
  closeChatbot: () => void;
  openChatbot: () => void;
  messages: ChatMessage[];
  sendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

const ChatbotContext = createContext<ChatbotContextType | null>(null);

export function ChatbotProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const hasLoadedHistory = useRef(false);
  
  const toggleChatbot = () => setIsOpen((prev) => !prev);
  const closeChatbot = () => setIsOpen(false);
  const openChatbot = () => setIsOpen(true);
  
  // Load chat history when user logs in
  useEffect(() => {
    if (user && !hasLoadedHistory.current) {
      const loadChatHistory = async () => {
        try {
          const response = await fetch(`/api/chat/history/${user.id}`);
          if (response.ok) {
            const history = await response.json();
            if (history.length === 0) {
              // Add welcome message if no history
              const welcomeMessage: ChatMessage = {
                id: 0,
                userId: user.id,
                message: "Приветствие",
                response: "Добро пожаловать в систему обучения HotelLearn! Я помогу вам найти нужные материалы и отвечу на вопросы. Чем я могу помочь?",
                timestamp: new Date()
              };
              setMessages([welcomeMessage]);
            } else {
              setMessages(history);
            }
          }
        } catch (error) {
          console.error("Failed to load chat history:", error);
          // Add fallback welcome message
          const welcomeMessage: ChatMessage = {
            id: 0,
            userId: user.id,
            message: "Приветствие",
            response: "Добро пожаловать в систему обучения HotelLearn! Я помогу вам найти нужные материалы и отвечу на вопросы. Чем я могу помочь?",
            timestamp: new Date()
          };
          setMessages([welcomeMessage]);
        }
        hasLoadedHistory.current = true;
      };
      
      loadChatHistory();
    }
  }, [user]);
  
  const sendMessage = async (message: string) => {
    if (!user || !message.trim()) return;
    
    // Optimistically add user message to the UI
    const tempId = Date.now();
    const userMessage: ChatMessage = {
      id: tempId,
      userId: user.id,
      message,
      response: null,
      timestamp: new Date()
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/chat", {
        userId: user.id,
        message
      });
      
      const chatResponse = await response.json();
      
      // Replace the temp message with the actual response
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === tempId ? chatResponse : msg
        )
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      // Update the temp message with an error
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === tempId 
            ? { 
                ...msg, 
                response: "Извините, не удалось обработать ваш запрос. Пожалуйста, попробуйте еще раз." 
              } 
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <ChatbotContext.Provider 
      value={{ 
        isOpen, 
        toggleChatbot, 
        closeChatbot, 
        openChatbot,
        messages,
        sendMessage,
        isLoading
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot(): ChatbotContextType {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error("useChatbot must be used within a ChatbotProvider");
  }
  return context;
}
