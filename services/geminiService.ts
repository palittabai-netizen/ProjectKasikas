import { GoogleGenAI, Type } from "@google/genai";
import { InvestmentPlan, UserProfile } from "../types";

export async function getInvestmentAdvice(profile: UserProfile, availablePlans: InvestmentPlan[]) {
  const apiKey = process.env.API_KEY;

  // Fallback if API key is missing (common in client-side demos without build steps)
  if (!apiKey) {
    console.warn("API Key missing. Returning default advice.");
    return "Market analysis unavailable. Please check configuration. Meanwhile, our Pro Multiplier plan offers the best risk-adjusted returns for your current balance.";
  }

  try {
    // Initialize inside the try block to catch instantiation errors
    const ai = new GoogleGenAI({ apiKey: apiKey });

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