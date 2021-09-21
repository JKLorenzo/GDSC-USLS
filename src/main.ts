import { Client, Intents } from 'discord.js';
import { initGateway } from './managers/gateway.js';
import { initInteraction } from './managers/interaction.js';
import { initTelemetry } from './managers/telemetry.js';

export const client = new Client({
  allowedMentions: {
    parse: ['everyone', 'roles', 'users'],
    repliedUser: true,
  },
  intents: [Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS],
  presence: {
    status: 'online',
    afk: false,
  },
});

client.on('ready', async () => {
  console.log('online');
  await initTelemetry();
  await initInteraction();
  await initGateway();
  console.log('initialized');
});

client.login(process.env.BOT_TOKEN!);
