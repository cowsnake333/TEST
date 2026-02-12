
import { GoogleGenAI, Type } from "@google/genai";
import { Task } from "../types";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export const breakdownTask = async (taskText: string): Promise<string[]> => {
  const ai = getAIClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Break down this task into 3 to 5 actionable subtasks: "${taskText}". Return only the list of subtasks.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Error breaking down task:", error);
    return [];
  }
};

export const getDailyInsights = async (tasks: Task[]): Promise<string> => {
  if (tasks.length === 0) return "Add some tasks to get personalized AI productivity insights!";
  
  const ai = getAIClient();
  const taskListSummary = tasks
    .map(t => `- [${t.priority.toUpperCase()}] ${t.text} (${t.completed ? 'Done' : 'Pending'})`)
    .join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a productivity coach. Analyze these tasks and give one concise piece of advice (max 2 sentences) on what to prioritize or how to be more efficient today:\n${taskListSummary}`,
    });
    return response.text || "Keep crushing your goals!";
  } catch (error) {
    console.error("Error getting insights:", error);
    return "Stay focused and keep moving forward.";
  }
};
