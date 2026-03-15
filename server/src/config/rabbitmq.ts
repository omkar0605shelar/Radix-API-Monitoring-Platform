import amqp, { Connection, Channel } from 'amqplib';
import dotenv from 'dotenv';
dotenv.config();

let connection: Connection;
let channel: Channel;

export const connectRabbitMQ = async () => {
  try {
    const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    connection = await amqp.connect(url);
    channel = await connection.createChannel();
    console.log('RabbitMQ Connected');
    
    // Assert required queues
    const queues = ['api_scan_jobs'];
    for (const q of queues) {
      await channel.assertQueue(q, { durable: true });
    }
    
    return channel;
  } catch (error) {
    console.error('RabbitMQ Connection Error:', error);
    throw error;
  }
};

export const getChannel = () => channel;
