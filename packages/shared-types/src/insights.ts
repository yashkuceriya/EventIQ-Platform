export type InsightType = 'anomaly' | 'trend' | 'summary' | 'recommendation';

export interface Insight {
  id: string;
  eventId: string;
  type: InsightType;
  confidence: number;
  title: string;
  description: string;
  aiModel: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface AnomalyDetection {
  isAnomaly: boolean;
  confidence: number;
  description: string;
  affectedEvents: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface TrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  confidence: number;
  description: string;
  dataPoints: Array<{ timestamp: Date; value: number }>;
}
