import 'dotenv/config';
import { KafkaConsumerClient, KafkaProducerClient, TOPICS } from '@eventiq/kafka-client';
import { prisma } from '@eventiq/database';
import { ValidatedEvent, Insight } from '@eventiq/shared-types';
import Redis from 'ioredis';
import { AnomalyDetector } from './ai/anomaly-detector';
import { TrendAnalyzer } from './ai/trend-analyzer';
import { EventSummarizer } from './ai/summarizer';

const redis = new Redis(process.env.REDIS_URL!);

const consumer = new KafkaConsumerClient({
  brokers: process.env.KAFKA_BROKERS!.split(','),
  clientId: 'ai-analysis-service',
  groupId: 'ai-analysis-group',
});

const producer = new KafkaProducerClient({
  brokers: process.env.KAFKA_BROKERS!.split(','),
  clientId: 'ai-analysis-service',
});

const anomalyDetector = new AnomalyDetector();
const trendAnalyzer = new TrendAnalyzer();
const summarizer = new EventSummarizer();

async function processEvent(event: ValidatedEvent): Promise<void> {
  console.log(`Processing event: ${event.id} (${event.type})`);

  try {
    // Get recent events for context
    const recentEvents = await prisma.event.findMany({
      where: {
        type: event.type,
        timestamp: {
          gte: new Date(Date.now() - 3600000), // Last hour
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    // Run AI analyses in parallel
    const [anomalyResult, trendResult, summary] = await Promise.all([
      anomalyDetector.analyze(event, recentEvents),
      trendAnalyzer.analyze(event.type, recentEvents),
      event.severity === 'high' || event.severity === 'critical'
        ? summarizer.summarize([event, ...recentEvents.slice(0, 5)])
        : null,
    ]);

    // Create insights
    const insights: Partial<Insight>[] = [];

    if (anomalyResult.isAnomaly) {
      insights.push({
        eventId: event.id,
        type: 'anomaly',
        confidence: anomalyResult.confidence,
        title: `Anomaly detected in ${event.type}`,
        description: anomalyResult.description,
        aiModel: 'gpt-4',
        metadata: {
          severity: anomalyResult.severity,
          affectedEvents: anomalyResult.affectedEvents,
        },
      });
    }

    if (trendResult) {
      insights.push({
        eventId: event.id,
        type: 'trend',
        confidence: trendResult.confidence,
        title: `Trend: ${trendResult.trend} activity`,
        description: trendResult.description,
        aiModel: 'gpt-4',
        metadata: {
          trend: trendResult.trend,
          dataPoints: trendResult.dataPoints,
        },
      });
    }

    if (summary) {
      insights.push({
        eventId: event.id,
        type: 'summary',
        confidence: 0.9,
        title: 'Event cluster summary',
        description: summary,
        aiModel: 'gpt-4',
      });
    }

    // Save insights to database
    if (insights.length > 0) {
      const createdInsights = await Promise.all(
        insights.map(insight =>
          prisma.insight.create({
            data: {
              ...insight,
              createdAt: new Date(),
            } as any,
          })
        )
      );

      // Publish insights to Kafka
      for (const insight of createdInsights) {
        await producer.sendMessage(
          TOPICS.INSIGHTS_GENERATED,
          insight,
          insight.eventId
        );
      }

      console.log(`✅ Generated ${insights.length} insights for event ${event.id}`);

      // Cache insights
      await redis.setex(
        `insights:event:${event.id}`,
        3600,
        JSON.stringify(createdInsights)
      );
    }

  } catch (error) {
    console.error('Error processing event:', error);
    throw error;
  }
}

async function main() {
  try {
    await consumer.connect();
    await producer.connect();
    
    console.log('✅ Kafka clients connected');

    await consumer.subscribe([TOPICS.EVENTS_VALIDATED]);
    
    console.log('✅ Subscribed to events.validated topic');

    await consumer.consume(async ({ message }) => {
      try {
        const event = message as ValidatedEvent;
        await processEvent(event);
      } catch (error) {
        console.error('Failed to process message:', error);
        // Send to DLQ
        await producer.sendMessage(TOPICS.EVENTS_DLQ, message);
      }
    });

    console.log('🚀 AI Analysis Service running');

  } catch (error) {
    console.error('❌ Failed to start service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down gracefully...');
  await consumer.disconnect();
  await producer.disconnect();
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

main();
