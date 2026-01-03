import OpenAI from 'openai';
import { ValidatedEvent, AnomalyDetection } from '@eventiq/shared-types';

export class AnomalyDetector {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyze(
    currentEvent: ValidatedEvent,
    recentEvents: any[]
  ): Promise<AnomalyDetection> {
    try {
      const prompt = `
You are an anomaly detection system. Analyze this event and recent historical events to determine if there's an anomaly.

Current Event:
- Type: ${currentEvent.type}
- Source: ${currentEvent.source}
- Severity: ${currentEvent.severity}
- Message: ${currentEvent.message}
- Timestamp: ${currentEvent.timestamp}

Recent Events (last hour):
${recentEvents.slice(0, 10).map((e, i) => `
${i + 1}. Type: ${e.type}, Severity: ${e.severity}, Time: ${e.timestamp}
   Message: ${e.message}
`).join('')}

Determine:
1. Is this an anomaly?
2. Confidence level (0-1)
3. Description of the anomaly
4. Severity level
5. Affected event IDs

Respond ONLY with valid JSON:
{
  "isAnomaly": boolean,
  "confidence": number,
  "description": string,
  "severity": "low" | "medium" | "high" | "critical",
  "affectedEvents": string[]
}
      `.trim();

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content!);
      return result as AnomalyDetection;

    } catch (error) {
      console.error('Anomaly detection error:', error);
      return {
        isAnomaly: false,
        confidence: 0,
        description: 'Analysis failed',
        affectedEvents: [],
        severity: 'low',
      };
    }
  }
}
