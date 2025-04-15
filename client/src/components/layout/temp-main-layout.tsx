import { ReactNode } from "react";
import { AIChat } from "../chatbot/ai-chat";
import { Sidebar } from "./sidebar";
import { useChatbot } from "@/context/chatbot-context";

interface TempMainLayoutProps {
  children: ReactNode;
}

export function TempMainLayout({ children }: TempMainLayoutProps) {
  const { isOpen } = useChatbot();
  
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Content wrapper */}
      <div className="flex flex-col flex-1 md:ml-64">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
          {children}
        </main>
      </div>
      
      {/* AI Chat Overlay */}
      {isOpen && <AIChat />}
    </div>
  );
}