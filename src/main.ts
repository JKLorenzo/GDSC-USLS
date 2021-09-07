import { Client, Intents } from 'discord.js';
import { initInteraction } from './managers/interaction.js';
import { initTelemetry } from './modules/telemetry.js';

export const client = new Client({
  allowedMentions: {
    parse: ['everyone', 'roles', 'users'],
    repliedUser: true,
  },
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS],
  presence: {
    status: 'online',
    afk: false,
  },
});

client.on('ready', async () => {
  console.log('online');
  await initTelemetry();
  await initInteraction();
  console.log('initialized');
});

client.login(process.env.BOT_TOKEN!);
