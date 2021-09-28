import { TextChannel, Webhook } from 'discord.js';
import { GDSCClient } from '../client.js';
import constants from '../utils/contants.js';

export default class TelemetryManager {
  private client: GDSCClient;
  private webhook?: Webhook;
  constructor(client: GDSCClient) {
    this.client = client;

    client.on('rateLimit', data => {
      this.webhook?.send({
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
      this.webhook?.send({
        username: 'Telemetry: Client Warning',
        content: message,
      });
    });

    client.on('error', error => {
      this.webhook?.send({
        username: 'Telemetry: Client Error',
        content: `${error.name}: ${error.message}`,
      });
    });
  }

  async init(): Promise<void> {
    const bot_logs = this.client.channel(constants.channels.bot_logs);
    if (bot_logs instanceof TextChannel) {
      const webhooks = await bot_logs.fetchWebhooks();
      this.webhook = webhooks.find(w => w.name === 'Telemetry');
      if (!this.webhook) {
        this.webhook = await bot_logs.createWebhook('Telemetry', {
          avatar: this.client.user?.displayAvatarURL(),
        });
      }
    }
  }

  async logError(module: string, method: string, error: unknown): Promise<void> {
    console.warn({ module, method, error });
    await this.webhook?.send({
      username: `Telemetry: ${module}`,
      content: `**${method}** - ${error}`,
    });
  }

  async logMessage(module: string, method: string, message: string): Promise<void> {
    console.log({ module, method, message });
    await this.webhook?.send({
      username: `Telemetry: ${module}`,
      content: `**${method}** - ${message}`,
    });
  }
}
