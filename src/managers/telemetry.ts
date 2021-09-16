import { TextChannel, Webhook } from 'discord.js';
import { client } from '../main.js';
import constants from '../utils/contants.js';

let telemetryWebhook: Webhook | undefined;

export async function initTelemetry(): Promise<void> {
  // Initialize telemetry webhook
  const guild = client.guilds.cache.get(constants.guild);
  const bot_logs = guild?.channels.cache.get(constants.channels.bot_logs);
  if (bot_logs instanceof TextChannel) {
    const webhooks = await bot_logs.fetchWebhooks();
    telemetryWebhook = webhooks.find(w => w.name === 'Telemetry');
    if (!telemetryWebhook) {
      telemetryWebhook = await bot_logs.createWebhook('Telemetry', {
        avatar: client.user?.displayAvatarURL(),
      });
    }
  }

  client.on('rateLimit', data => {
    telemetryWebhook?.send({
      username: 'Telemetry: Client Rate Limit',
      content: [
        `${data.method} ${data.path}`,
        `Limit: ${data.limit}`,
        `Global: ${data.global}`,
        `Timeout: ${data.timeout}`,
      ].join('\n'),
    });
  });

  client.on('warn', message => {
    telemetryWebhook?.send({
      username: 'Telemetry: Client Warning',
      content: message,
    });
  });

  client.on('error', error => {
    telemetryWebhook?.send({
      username: 'Telemetry: Client Error',
      content: `${error.name}: ${error.message}`,
    });
  });
}

export function logError(name: string, title: string, error: unknown): void {
  telemetryWebhook?.send({
    username: `Telemetry: ${name}`,
    content: `**${title}** - ${error}`,
  });
}

export function logMessage(name: string, message: string): void {
  console.log(message);
  telemetryWebhook?.send({
    username: `Telemetry: ${name}`,
    content: message,
  });
}
