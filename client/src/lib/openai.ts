import { apiRequest } from "./queryClient";

export async function sendChatMessage(userId: number, message: string) {
  try {
    const response = await apiRequest("POST", "/api/chat", {
      userId,
      message
    });
    
    return await response.json();
  } catch (error) {
    console.error("Failed to send chat message:", error);
    throw error;
  }
}

export async function getChatHistory(userId: number, limit = 20) {
  try {
    const response = await fetch(`/api/chat/history/${userId}?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch chat history: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch chat history:", error);
    throw error;
  }
}
