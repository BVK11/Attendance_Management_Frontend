import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY || '');

export const aiService = {
  async analyzeLeaveReason(reason: string): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `Analyze this leave reason and provide a brief summary or insight: "${reason}"`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return text || 'Unable to analyze the leave reason.';
    } catch (error) {
      console.error('AI analysis error:', error);
      return 'Error analyzing leave reason. Please try again.';
    }
  }
};