import { useCallback, useEffect } from "react";
import { useChatbot } from "@/context/chatbot-context";
import { useAuth } from "@/context/auth-context";
import { AIChat } from "./ai-chat";

export function ChatbotButton() {
  const { user } = useAuth();
  const { loadUserChatHistory, isChatbotOpen, toggleChatbot } = useChatbot();
  
  // Load chat history when user is available
  useEffect(() => {
    if (user) {
      loadUserChatHistory(user.id);
    }
  }, [user, loadUserChatHistory]);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-20">
        <button 
          className="bg-primary text-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-primary-dark transition-colors"
          onClick={toggleChatbot}
          aria-label="Открыть помощника"
        >
          <span className="material-icons">smart_toy</span>
        </button>
      </div>
      {!isChatbotOpen && <AIChat />} {/* AI Chat Overlay */}
    </>
  );
}