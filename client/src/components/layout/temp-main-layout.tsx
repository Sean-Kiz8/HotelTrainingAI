import { ReactNode } from "react";
import { AIChat } from "../chatbot/ai-chat";

interface TempMainLayoutProps {
  children: ReactNode;
}

export function TempMainLayout({ children }: TempMainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100">
      {/* Content wrapper */}
      <div className="flex flex-col flex-1">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}