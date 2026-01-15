import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const polishContent = async (content: string): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please configure process.env.API_KEY.");
  }

  if (!content.trim()) return "";

  try {
    const model = 'gemini-3-flash-preview';
    const prompt = `
      You are a professional editor. Please improve the following Markdown text.
      
      Instructions:
      1. Fix grammar and spelling errors.
      2. Improve clarity and flow while maintaining the original meaning.
      3. Ensure Markdown formatting (headers, lists, bolding) is consistent and correctly structured.
      4. Return ONLY the improved Markdown content. Do not add conversational text.

      Input Markdown:
      ${content}
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || content;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to polish content via Gemini.");
  }
};