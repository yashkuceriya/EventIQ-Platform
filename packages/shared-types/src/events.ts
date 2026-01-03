import { z } from 'zod';

export const EventSeverity = ['low', 'medium', 'high', 'critical'] as const;

export const RawEventSchema = z.object({
  type: z.string().min(1),
  source: z.string().min(1),
  severity: z.enum(EventSeverity),
  message: z.string().min(1),
  metadata: z.record(z.any()).optional(),
  userId: z.string().optional(),
});

export type RawEvent = z.infer<typeof RawEventSchema>;

export interface ValidatedEvent extends RawEvent {
  id: string;
  timestamp: Date;
  validatedAt: Date;
}

export interface EventMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  eventsBySource: Record<string, number>;
}
