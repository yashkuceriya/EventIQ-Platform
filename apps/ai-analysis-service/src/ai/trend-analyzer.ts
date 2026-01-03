import OpenAI from 'openai';
import { TrendAnalysis } from '@eventiq/shared-types';

export class TrendAnalyzer {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyze(
    eventType: string,
    recentEvents: any[]
  ): Promise<TrendAnalysis | null> {
    if (recentEvents.length < 5) {
      return null; // Not enough data
    }

    try {
      const dataPoints = recentEvents.map(e => ({
        timestamp: e.timestamp,
        value: 1, // Count-based for now
      }));

      const prompt = `
Analyze this event trend data:

Event Type: ${eventType}
Data Points: ${JSON.stringify(dataPoints, null, 2)}

Determine:
1. Overall trend (increasing/decreasing/stable/volatile)
2. Confidence level (0-1)
3. Description

Respond ONLY with valid JSON:
{
  "trend": "increasing" | "decreasing" | "stable" | "volatile",
  "confidence": number,
  "description": string
}
      `.trim();

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content!);
      return {
        ...result,
        dataPoints,
      } as TrendAnalysis;

    } catch (error) {
      console.error('Trend analysis error:', error);
      return null;
    }
  }
}
