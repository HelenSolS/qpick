
import { GoogleGenAI } from "@google/genai";

/**
 * Service to generate creative greeting messages using Gemini AI.
 */
export const generateGreeting = async (
  sender: string,
  recipient: string,
  tone: string,
  certName: string
): Promise<string> => {
  // Initialize Gemini API client with the environment API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Напиши короткое, вдохновляющее и теплое поздравление для подарочного сертификата на фотосессию "Q-PIC".
    Отправитель: ${sender}
    Получатель: ${recipient}
    Название тарифа: ${certName}
    Настроение (тон): ${tone}
    
    Требования:
    - Текст на русском языке.
    - Длина до 150 символов.
    - Без лишних кавычек в начале и конце.
    - Упомяни, что это прекрасный повод запечатлеть момент.`;

  try {
    // Generate content using the recommended model for basic text tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Access the text property directly from the response as per documentation
    return response.text?.trim() || '';
  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw new Error("Не удалось сгенерировать поздравление. Пожалуйста, попробуйте позже.");
  }
};
