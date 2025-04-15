import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./context/auth-context";
import { ChatbotProvider } from "./context/chatbot-context";
import { ChatbotButton } from "./components/chatbot/chatbot-button";
import Mockup from "./mockup";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ChatbotProvider>
        <Mockup />
        <ChatbotButton />
        <Toaster />
      </ChatbotProvider>
    </AuthProvider>
  </QueryClientProvider>
);
