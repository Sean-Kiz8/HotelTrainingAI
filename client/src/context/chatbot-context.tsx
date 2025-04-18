import { createContext, useContext, useState, useRef, useEffect } from "react";
import { sendChatMessage, getChatHistory } from "@/lib/openai";
import type { ChatMessage } from "@shared/schema";
import { AuthUser } from "./auth-context";

interface ChatbotContextType {
  isChatbotOpen: boolean;
  messages: ChatMessage[];
  sendMessage: (message: string, userId?: number) => Promise<void>;
  isLoading: boolean;
  loadUserChatHistory: (userId: number) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  historyLoaded: boolean;
  toggleChatbot: () => void;
  openChatbot: () => void;
  closeChatbot: () => void;
}

// Create default context values
const defaultContextValue: ChatbotContextType = {
  isChatbotOpen: false,
  messages: [],
  sendMessage: async () => {},
  isLoading: false,
  loadUserChatHistory: async () => {},
  addMessage: () => {},
  historyLoaded: false,
  toggleChatbot: () => {},
  openChatbot: () => {},
  closeChatbot: () => {}
};

const ChatbotContext = createContext<ChatbotContextType>(defaultContextValue);

// Default welcome message
const createWelcomeMessage = (userId = 1): ChatMessage => ({
  id: 0,
  userId,
  message: "Приветствие",
  response: "Добро пожаловать в систему обучения HotelLearn! Я помогу вам найти нужные материалы и отвечу на вопросы. Чем я могу помочь?",
  timestamp: new Date()
});

export function ChatbotProvider({ children }: { children: React.ReactNode }) {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([createWelcomeMessage()]);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedHistory = useRef(false);
  
  const toggleChatbot = () => setIsChatbotOpen((prev) => !prev);
  const closeChatbot = () => setIsChatbotOpen(false);
  const openChatbot = () => setIsChatbotOpen(true);
  
  // Load chat history for a specific user
  const loadUserChatHistory = async (userId: number) => {
    if (hasLoadedHistory.current) return;
    
    try {
      const history = await getChatHistory(userId);
      if (history.length === 0) {
        setMessages([createWelcomeMessage(userId)]);
      } else {
        setMessages(history);
      }
      hasLoadedHistory.current = true;
    } catch (error) {
      console.error("Failed to load chat history:", error);
      setMessages([createWelcomeMessage(userId)]);
    }
  };
  
  const sendMessage = async (message: string, userId = 1) => {
    if (!message.trim()) return;
    
    // Optimistically add user message to the UI
    const tempId = Date.now();
    const userMessage: ChatMessage = {
      id: tempId,
      userId,
      message,
      response: null,
      timestamp: new Date()
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      const chatResponse = await sendChatMessage(userId, message);
      
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
  
  // Функция для добавления внешнего сообщения (например, от загрузки файла)
  const addMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  };
  
  return (
    <ChatbotContext.Provider 
      value={{ 
        isChatbotOpen,
        toggleChatbot,
        openChatbot,
        closeChatbot,
        messages,
        sendMessage,
        isLoading,
        loadUserChatHistory,
        addMessage,
        historyLoaded: hasLoadedHistory.current
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  return useContext(ChatbotContext);
}
