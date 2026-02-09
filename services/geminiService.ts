import { GoogleGenAI, Type } from "@google/genai";
import { InvestmentPlan, UserProfile } from "../types";

export async function getInvestmentAdvice(profile: UserProfile, availablePlans: InvestmentPlan[]) {
  // Initialize inside the function to ensure process.env is ready and avoid top-level crashes
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    As a sophisticated investment bot for a USDT Yield platform, analyze this user's profile and suggest the best strategy.
    
    User Profile:
    - Current Balance: ${profile.balance} USDT
    - Locked (Active) Balance: ${profile.lockedBalance} USDT
    - Account Level: ${profile.role}
    
    Available Investment Plans:
    ${availablePlans.map(p => `- ${p.name}: Cost ${p.price} USDT, Daily Interest ${p.dailyInterestRate}%, Duration ${p.durationDays} days`).join('\n')}
    
    Provide a concise, encouraging recommendation (under 100 words) on which plan they should consider next or if they should save up.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("AI Insight Error:", error);
    return "The market looks stable. Consider diversifying your yield strategies with our Pro and Elite plans for maximum passive returns.";
  }
}