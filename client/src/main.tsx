import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/auth-context";
import { ChatbotProvider } from "./context/chatbot-context";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ChatbotProvider>
      <App />
    </ChatbotProvider>
  </AuthProvider>
);
