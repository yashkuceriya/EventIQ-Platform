import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import Redis from 'ioredis';
import { KafkaConsumerClient, TOPICS } from '@eventiq/kafka-client';
import { prisma } from '@eventiq/database';
import { ValidatedEvent, Insight } from '@eventiq/shared-types';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const redis = new Redis(process.env.REDIS_URL!);

const consumer = new KafkaConsumerClient({
  brokers: process.env.KAFKA_BROKERS!.split(','),
  clientId: 'analytics-service',
  groupId: 'analytics-group',
});

// Middleware
app.use(cors());
app.use(express.json());

// WebSocket connections
const clients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  console.log('New WebSocket client connected');
  clients.add(ws);

  ws.on('close', () => {
    clients.delete(ws);
    console.log('WebSocket client disconnected');
  });
});

function broadcast(data: any) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    service: 'analytics',
    wsClients: clients.size 
  });
});

// Get real-time metrics
app.get('/api/metrics/realtime', async (req: Request, res: Response) => {
  try {
    const [total, byType, bySeverity, bySource] = await Promise.all([
      redis.hget('metrics:events:total', 'count'),
      redis.hgetall('metrics:events:by-type'),
      redis.hgetall('metrics:events:by-severity'),
      redis.hgetall('metrics:events:by-source'),
    ]);

    res.json({
      total: parseInt(total || '0'),
      byType,
      bySeverity,
      bySource,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Get events with pagination
app.get('/api/events', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          insights: true,
        },
      }),
      prisma.event.count(),
    ]);

    res.json({
      items: events,
      total,
      page,
      limit,
      hasNext: skip + limit < total,
      hasPrev: page > 1,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get insights
app.get('/api/insights', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;

    const where = type ? { type } : {};

    const [insights, total] = await Promise.all([
      prisma.insight.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          event: true,
        },
      }),
      prisma.insight.count({ where }),
    ]);

    res.json({
      items: insights,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// Get analytics dashboard data
app.get('/api/analytics/dashboard', async (req: Request, res: Response) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalEvents,
      recentEvents,
      criticalEvents,
      anomalyCount,
      eventTimeline,
    ] = await Promise.all([
      prisma.event.count(),
      prisma.event.count({
        where: { timestamp: { gte: last24h } },
      }),
      prisma.event.count({
        where: { 
          severity: 'critical',
          timestamp: { gte: last24h },
        },
      }),
      prisma.insight.count({
        where: { 
          type: 'anomaly',
          createdAt: { gte: last24h },
        },
      }),
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('hour', timestamp) as hour,
          COUNT(*) as count,
          severity
        FROM events
        WHERE timestamp >= ${last24h}
        GROUP BY hour, severity
        ORDER BY hour ASC
      `,
    ]);

    res.json({
      totalEvents,
      recentEvents,
      criticalEvents,
      anomalyCount,
      eventTimeline,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Kafka consumer for real-time updates
async function startKafkaConsumer() {
  await consumer.connect();
  await consumer.subscribe([
    TOPICS.EVENTS_VALIDATED,
    TOPICS.INSIGHTS_GENERATED,
  ]);

  await consumer.consume(async ({ topic, message }) => {
    try {
      // Broadcast to WebSocket clients
      broadcast({
        type: topic,
        data: message,
        timestamp: new Date(),
      });

      // Update Redis metrics
      if (topic === TOPICS.EVENTS_VALIDATED) {
        const event = message as ValidatedEvent;
        await redis.hincrby('metrics:events:by-source', event.source, 1);
      }

    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  console.log('✅ Kafka consumer started');
}

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down gracefully...');
  wss.close();
  await consumer.disconnect();
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
const PORT = process.env.PORT || 3003;

async function main() {
  try {
    await startKafkaConsumer();

    server.listen(PORT, () => {
      console.log(`🚀 Analytics Service running on port ${PORT}`);
      console.log(`📊 WebSocket server ready at ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start service:', error);
    process.exit(1);
  }
}

main();
