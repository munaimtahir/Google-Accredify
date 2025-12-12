import { GoogleGenAI } from "@google/genai";
import { Indicator } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

export const askComplianceAssistant = async (question: string, contextIndicators: Indicator[]) => {
  try {
    const contextString = contextIndicators.map(ind => 
      `- Indicator: "${ind.indicator}" (Section: ${ind.section}, Standard: ${ind.standard}): ${ind.status}`
    ).join('\n');

    const prompt = `
      You are an expert consultant for PHC (Public Health Laboratory) Licensing and MSDS Compliance.
      
      Here is the current status of the laboratory's compliance checklist:
      ${contextString}

      The user asks: "${question}"

      Provide a helpful, professional, and concise answer. If the user asks about a specific standard, explain it simply. If they ask for advice on how to become compliant for a specific indicator in the list, provide actionable steps. Use the terms Section, Standard, and Indicator correctly.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I'm having trouble connecting to the compliance database right now. Please try again later.";
  }
};

export const generateComplianceReportSummary = async (indicators: Indicator[]) => {
  try {
    const complianceData = JSON.stringify(indicators.map(i => ({
      indicator: i.indicator,
      standard: i.standard,
      section: i.section,
      status: i.status,
      score: i.score,
      hasEvidence: i.evidence.length > 0
    })));

    const prompt = `
      Analyze the following laboratory compliance data in JSON format:
      ${complianceData}

      Generate a brief executive summary (max 150 words) suitable for a PHC auditor. 
      Highlight the overall readiness, key Sections of success (Compliant), and critical Standards needing attention (Non-Compliant or Not Started).
      Keep the tone formal and objective.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Report Error:", error);
    return "Unable to generate AI report summary at this time.";
  }
};