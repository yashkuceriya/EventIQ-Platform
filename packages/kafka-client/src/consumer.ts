import { Consumer, EachMessagePayload } from 'kafkajs';
import { createKafkaClient, KafkaClientConfig } from './config';

export type MessageHandler = (payload: {
  topic: string;
  partition: number;
  message: any;
}) => Promise<void>;

export interface ConsumerConfig extends KafkaClientConfig {
  groupId: string;
}

export class KafkaConsumerClient {
  private consumer: Consumer;
  private connected: boolean = false;

  constructor(config: ConsumerConfig) {
    const kafka = createKafkaClient(config);
    this.consumer = kafka.consumer({ groupId: config.groupId });
  }

  async connect(): Promise<void> {
    if (!this.connected) {
      await this.consumer.connect();
      this.connected = true;
      console.log('Kafka consumer connected');
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.consumer.disconnect();
      this.connected = false;
      console.log('Kafka consumer disconnected');
    }
  }

  async subscribe(topics: string[]): Promise<void> {
    await this.consumer.subscribe({ 
      topics, 
      fromBeginning: false 
    });
  }

  async consume(handler: MessageHandler): Promise<void> {
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
        try {
          const value = message.value?.toString();
          const parsedMessage = value ? JSON.parse(value) : null;

          await handler({
            topic,
            partition,
            message: parsedMessage,
          });
        } catch (error) {
          console.error('Error processing message:', error);
          throw error;
        }
      },
    });
  }
}
