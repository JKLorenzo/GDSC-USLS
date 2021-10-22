import {
  CommandInteraction,
  GuildChannel,
  MessageOptions,
  MessagePayload,
  TextBasedChannels,
} from 'discord.js';
import { client } from '../../client.js';
import Command from '../../structures/command.js';
import constants from '../../utils/contants.js';

export default class Message extends Command {
  constructor() {
    super(
      'guild',
      {
        name: 'message',
        description: '[Core] Sends a message to a channel or a user.',
        type: 'CHAT_INPUT',
        defaultPermission: false,
        options: [
          {
            name: 'relay',
            description: "[Core] Resends the message you'll send to a channel.",
            type: 'SUB_COMMAND',
          },
          {
            name: 'channel',
            description: '[Core] Sends a message to a channel.',
            type: 'SUB_COMMAND',
            options: [
              {
                name: 'target',
                description: 'The channel where the message will be sent.',
                type: 'CHANNEL',
                required: true,
              },
              {
                name: 'content',
                description: 'The content of the message.',
                type: 'STRING',
                required: true,
              },
            ],
          },
          {
            name: 'user',
            description: '[Core] Sends a message to a user.',
            type: 'SUB_COMMAND',
            options: [
              {
                name: 'target',
                description: 'The user where the message will be sent.',
                type: 'USER',
                required: true,
              },
              {
                name: 'content',
                description: 'The content of the message.',
                type: 'STRING',
                required: true,
              },
            ],
          },
        ],
      },
      {
        guilds: guild => {
          if (guild.id !== constants.guild) return false;
          return true;
        },
        permissions: {
          roles: {
            allow: [constants.roles.core],
          },
        },
      },
    );
  }

  async exec(interaction: CommandInteraction): Promise<unknown> {
    let result;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'relay') {
      const user = interaction.user;
      const channel = interaction.channel as TextBasedChannels;

      await interaction.deferReply({ ephemeral: true });

      try {
        const messages = await channel.awaitMessages({
          filter: msg => msg.author.id === user.id,
          max: 1,
          time: 60000,
          errors: ['time'],
        });

        const message = messages.first();
        if (!message) throw new Error('time');

        result = await client.managers.message.sendToChannel(channel.id, {
          content: message.content.length ? message.content : null,
          files: [...message.attachments.values()],
        });

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        message.delete().catch(() => {});
      } catch (error) {
        if (`${error}` === 'time') {
          return interaction.editReply('Message Relay was cancelled due to inactivity.');
        }
        return interaction.editReply(`Message Relay was cancelled due to an error.\n${error}`);
      }
    } else {
      await interaction.deferReply();
      const content = interaction.options.getString('content', true);
      if (subcommand === 'channel') {
        const channel = interaction.options.getChannel('target', true) as GuildChannel;
        if (!channel.isText()) {
          return interaction.editReply('This channel is not a text channel. Please try again.');
        }
        result = await client.managers.message.sendToChannel(channel, parse(content));
      } else if (subcommand === 'user') {
        const user = interaction.options.getUser('target', true);
        result = await client.managers.message.sendToUser(user, parse(content));
      }
    }

    interaction.editReply(`Your message has been sent! Message ID: \`${result?.id}\``);
  }
}

function parse(message: string): string | MessagePayload | MessageOptions {
  if (message === 'rules') return rules;
  if (message === 'verify') return verify;
  return message;
}

const rules: MessagePayload | MessageOptions = {
  content: [
    '**__SERVER RULES__**',
    '',
    'This list does not constitute the full set of rules, and our Moderators may take ' +
      'action on misbehavior and violations that are not explicitly listed below:',
    '',
    '1️⃣ Treat everyone with respect. Absolutely no harassment, sexism, racism, or hate speech will be tolerated.',
    '',
    '2️⃣ No spam or self-promotion (server invites, advertisements, etc) without permission ' +
      'from a staff member. This includes DMing fellow members.',
    '',
    '3️⃣ No NSFW or obscene content. This includes text, images, or links featuring nudity, sex ' +
      'hard violence, or other graphically disturbing content.',
    '',
    '4️⃣ If you see something against the rules or something that makes you feel unsafe, let staff ' +
      'know. We want this server to be a welcoming space.',
    '',
    'This server also follows the Community Guidelines set by Discord; and you can read more of it ' +
      'here: <https://discord.com/guidelines>',
  ].join('\n'),
  components: client.managers.interaction.getComponent('rules'),
};

const verify: MessagePayload | MessageOptions = {
  content: [
    '**__VERIFICATION__**',
    '',
    "Before giving you access to all the features of this server, we'd like to ask a few simple questions.",
    '',
    "Once you're ready, just click the **Get Started** button down below.",
  ].join('\n'),
  components: client.managers.interaction.getComponent('verify'),
};
