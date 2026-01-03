import { Kafka, KafkaConfig } from 'kafkajs';

export interface KafkaClientConfig {
  brokers: string[];
  clientId: string;
  username?: string;
  password?: string;
  ssl?: boolean;
}

export function createKafkaClient(config: KafkaClientConfig): Kafka {
  const kafkaConfig: KafkaConfig = {
    clientId: config.clientId,
    brokers: config.brokers,
  };

  if (config.username && config.password) {
    kafkaConfig.ssl = config.ssl ?? true;
    kafkaConfig.sasl = {
      mechanism: 'scram-sha-256',
      username: config.username,
      password: config.password,
    };
  }

  return new Kafka(kafkaConfig);
}
