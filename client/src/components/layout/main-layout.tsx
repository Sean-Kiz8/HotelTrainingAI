import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { MobileHeader } from "./mobile-header";
import { AIChat } from "../chatbot/ai-chat";
import { useAuth } from "@/context/auth-context";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100">
      {/* Sidebar for desktop */}
      <Sidebar />
      
      {/* Content wrapper */}
      <div className="flex flex-col flex-1 md:pl-64">
        {/* Mobile Header */}
        <MobileHeader />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pt-0 md:pt-0 mt-16 md:mt-0">
          {children}
        </main>
      </div>
      
      {/* Chatbot */}
      <AIChat />
    </div>
  );
}
