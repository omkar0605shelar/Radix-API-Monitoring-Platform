// RabbitMQ Alert Worker - Disabled (RabbitMQ not configured)
// import amqp from 'amqplib';
// import prisma from '../config/client.js';

/**
 * Worker to process real-time alerts from RabbitMQ.
 * NOTE: Currently disabled - RabbitMQ not in use
 */
export async function startAlertWorker() {
  console.log('[Alert Worker] Disabled - RabbitMQ not configured');
  // Worker disabled - uncomment and install amqplib to enable
}
