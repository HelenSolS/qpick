
import { GoogleGenAI } from "@google/genai";

export async function generateGreeting(
  recipientName: string,
  senderName: string,
  occasion: string,
  tone: string
): Promise<string> {
  try {
    // Correct initialization: use process.env.API_KEY directly as a named parameter
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-3-flash-preview for basic text generation tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Напиши короткое и красивое поздравление для подарочного сертификата на фотосессию. 
      Кому: ${recipientName}. От кого: ${senderName}. Повод: ${occasion}. Тон: ${tone}.
      Текст должен быть на русском языке, вдохновляющим и не длиннее 250 символов.`,
    });
    
    // Accessing .text as a property, not a method, as per guidelines
    return response.text?.trim() || "Желаю прекрасных кадров и незабываемых эмоций!";
  } catch (error) {
    console.error("Gemini AI error:", error);
    return "Пусть этот сертификат станет началом твоей новой прекрасной истории в фотографиях!";
  }
}
