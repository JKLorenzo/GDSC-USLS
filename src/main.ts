import { Client, Intents } from 'discord.js';

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

client.on('ready', () => {
  console.log('online');
});

client.login(process.env.BOT_TOKEN!);
