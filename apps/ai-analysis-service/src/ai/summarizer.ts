import OpenAI from 'openai';

export class EventSummarizer {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async summarize(events: any[]): Promise<string> {
    try {
      const prompt = `
Summarize these related events into a concise paragraph:

${events.map((e, i) => `
Event ${i + 1}:
- Type: ${e.type}
- Source: ${e.source}
- Severity: ${e.severity}
- Message: ${e.message}
- Time: ${e.timestamp}
`).join('\n')}

Provide a clear, technical summary of what's happening.
      `.trim();

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 300,
      });

      return response.choices[0].message.content!;

    } catch (error) {
      console.error('Summarization error:', error);
      return 'Unable to generate summary';
    }
  }
}
