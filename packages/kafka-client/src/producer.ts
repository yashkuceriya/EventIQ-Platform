import { Producer, ProducerRecord, Message } from 'kafkajs';
import { createKafkaClient, KafkaClientConfig } from './config';

export class KafkaProducerClient {
  private producer: Producer;
  private connected: boolean = false;

  constructor(config: KafkaClientConfig) {
    const kafka = createKafkaClient(config);
    this.producer = kafka.producer();
  }

  async connect(): Promise<void> {
    if (!this.connected) {
      await this.producer.connect();
      this.connected = true;
      console.log('Kafka producer connected');
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.producer.disconnect();
      this.connected = false;
      console.log('Kafka producer disconnected');
    }
  }

  async sendMessage(topic: string, message: any, key?: string): Promise<void> {
    await this.producer.send({
      topic,
      messages: [
        {
          key: key || Date.now().toString(),
          value: JSON.stringify(message),
          timestamp: Date.now().toString(),
        },
      ],
    });
  }

  async sendBatch(topic: string, messages: any[]): Promise<void> {
    const kafkaMessages: Message[] = messages.map((msg, idx) => ({
      key: msg.id || `${Date.now()}-${idx}`,
      value: JSON.stringify(msg),
      timestamp: Date.now().toString(),
    }));

    await this.producer.send({
      topic,
      messages: kafkaMessages,
    });
  }
}
