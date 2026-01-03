import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
import Redis from 'ioredis';
import { KafkaProducerClient, TOPICS } from '@eventiq/kafka-client';
import { prisma } from '@eventiq/database';
import { RawEventSchema, RawEvent } from '@eventiq/shared-types';

// Initialize
const app = express();
const redis = new Redis(process.env.REDIS_URL!);

const kafkaProducer = new KafkaProducerClient({
  brokers: process.env.KAFKA_BROKERS!.split(','),
  clientId: 'event-ingestion-service',
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    service: 'event-ingestion',
    timestamp: new Date().toISOString()
  });
});

// Rate limiting helper
async function checkRateLimit(source: string): Promise<boolean> {
  const key = `ratelimit:${source}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, 60); // 1 minute window
  }
  
  return count <= 100; // 100 requests per minute
}

// Single event ingestion
app.post('/api/events', async (req: Request, res: Response) => {
  try {
    const validatedData = RawEventSchema.parse(req.body);
    
    // Check rate limit
    const allowed = await checkRateLimit(validatedData.source);
    if (!allowed) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        limit: 100,
        window: '1 minute'
      });
    }

    const rawEvent: RawEvent & { timestamp: Date } = {
      ...validatedData,
      timestamp: new Date(),
    };

    // Publish to Kafka
    await kafkaProducer.sendMessage(
      TOPICS.EVENTS_RAW, 
      rawEvent, 
      rawEvent.source
    );

    // Cache recent event
    await redis.setex(
      `event:recent:${rawEvent.source}`,
      300,
      JSON.stringify(rawEvent)
    );

    // Increment metrics
    await redis.hincrby('metrics:events:total', 'count', 1);
    await redis.hincrby('metrics:events:by-type', rawEvent.type, 1);
    await redis.hincrby('metrics:events:by-severity', rawEvent.severity, 1);

    console.log(`Event published: ${rawEvent.type} from ${rawEvent.source}`);

    res.status(202).json({ 
      success: true, 
      message: 'Event queued for processing',
      eventType: rawEvent.type,
      source: rawEvent.source
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Error processing event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Batch ingestion
app.post('/api/events/batch', async (req: Request, res: Response) => {
  try {
    const { events } = req.body;
    
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'Invalid batch format' });
    }

    if (events.length > 100) {
      return res.status(400).json({ 
        error: 'Batch size exceeds limit', 
        limit: 100 
      });
    }

    const validatedEvents = events.map(e => RawEventSchema.parse(e));
    const enrichedEvents = validatedEvents.map(e => ({
      ...e,
      timestamp: new Date(),
    }));

    await kafkaProducer.sendBatch(TOPICS.EVENTS_RAW, enrichedEvents);

    res.status(202).json({ 
      success: true, 
      processed: enrichedEvents.length 
    });

  } catch (error) {
    console.error('Error processing batch:', error);
    res.status(500).json({ error: 'Batch processing failed' });
  }
});

// Get metrics
app.get('/api/metrics', async (req: Request, res: Response) => {
  try {
    const total = await redis.hget('metrics:events:total', 'count');
    const byType = await redis.hgetall('metrics:events:by-type');
    const bySeverity = await redis.hgetall('metrics:events:by-severity');

    res.json({
      total: parseInt(total || '0'),
      byType,
      bySeverity
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down gracefully...');
  await kafkaProducer.disconnect();
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
const PORT = process.env.PORT || 3001;

async function main() {
  try {
    await kafkaProducer.connect();
    console.log('✅ Kafka producer connected');

    app.listen(PORT, () => {
      console.log(`🚀 Event Ingestion Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start service:', error);
    process.exit(1);
  }
}

main();
