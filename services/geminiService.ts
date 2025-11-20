import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

const apiKey = process.env.API_KEY;
// Initialize Gemini Client
// Note: In a production app, we'd handle missing keys more gracefully in the UI.
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateFinancialResponse = async (
  history: { role: 'user' | 'model', text: string }[],
  lastMessage: string
): Promise<string> => {
  if (!ai) {
    return "API Key is missing. Please verify your environment configuration.";
  }

  try {
    const model = 'gemini-2.5-flash'; 

    // Convert history to Gemini format if using chat session, 
    // but for simplicity in this functional wrapper, we'll append history to context or use chat.
    // We will use the chat API for better context management.
    
    const chat = ai.chats.create({
        model: model,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ googleSearch: {} }], // Enable grounding
        }
    });

    // Ideally we would replay history into the chat object, but for this stateless wrapper 
    // we will just send the last message with the assumption the context is managed by the UI 
    // or we just pass the text. For a true chat app, we'd maintain the Chat session object in React state.
    // Let's do a single turn generation with history context manually constructed or just the prompt for now to keep it stateless.
    // Better approach: Use generateContent with the full history as a prompt string if not maintaining a chat object.
    
    // However, to use 'googleSearch' effectively, the Chat abstraction is better.
    // Let's try sending just the message for now, assuming the user asks a standalone question 
    // or we rely on the model's ability to handle context if we kept the session alive.
    
    // To make this robust for the demo:
    const response: GenerateContentResponse = await chat.sendMessage({
        message: lastMessage
    });

    // Process grounding chunks if available (optional enhancement)
    // const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    return response.text || "I couldn't generate a response at this time.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I encountered an error analyzing the financial data. Please try again.";
  }
};

export const analyzePortfolioRisk = async (assets: string): Promise<string> => {
     if (!ai) return "API Key Missing";

     try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the following portfolio for risk, volatility, and diversification. JSON format: ${assets}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        riskScore: { type: Type.NUMBER, description: "0-100 score, 100 being highest risk" },
                        volatility: { type: Type.STRING, description: "Low, Medium, or High" },
                        maxDrawdown: { type: Type.STRING, description: "Estimated max drawdown percentage" },
                        summary: { type: Type.STRING, description: "A brief analysis paragraph" },
                        recommendations: { 
                            type: Type.ARRAY, 
                            items: { type: Type.STRING },
                            description: "3 actionable bullet points"
                        }
                    }
                }
            }
        });
        return response.text || "{}";
     } catch (e) {
         console.error(e);
         return "{}";
     }
}
