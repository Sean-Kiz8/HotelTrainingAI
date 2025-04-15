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

/**
 * Отправляет файл для анализа чат-ботом
 * @param userId ID пользователя
 * @param file Файл для анализа
 * @returns Объект с результатом анализа
 */
export async function uploadFileForChatAnalysis(userId: number, file: File) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId.toString());
    
    const response = await fetch("/api/chat/upload", {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Не удалось загрузить файл");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Ошибка при загрузке файла для анализа:", error);
    throw error;
  }
}
