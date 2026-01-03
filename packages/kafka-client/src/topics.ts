export const TOPICS = {
  EVENTS_RAW: 'events.raw',
  EVENTS_VALIDATED: 'events.validated',
  INSIGHTS_GENERATED: 'insights.generated',
  ANALYTICS_AGGREGATED: 'analytics.aggregated',
  EVENTS_DLQ: 'events.dlq',
} as const;

export type TopicName = typeof TOPICS[keyof typeof TOPICS];
