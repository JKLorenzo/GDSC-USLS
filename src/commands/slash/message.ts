import {
  CommandInteraction,
  GuildChannel,
  MessageOptions,
  MessagePayload,
  TextChannel,
} from 'discord.js';
import { sendToChannel, sendToUser } from '../../modules/message';
import Command from '../../structures/command.js';
import constants from '../../utils/contants.js';

export default class Message extends Command {
  constructor() {
    super(
      'guild',
      {
        name: 'message',
        description: '[Core] Sends a message to a channel or a user.',
        options: [
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
    await interaction.deferReply({ ephemeral: true });
    const subcommand = interaction.options.getSubcommand();
    const content = interaction.options.getString('content', true);
    let result;
    if (subcommand === 'channel') {
      const channel = interaction.options.getChannel('channel', true) as GuildChannel;
      if (!(channel instanceof TextChannel)) {
        return interaction.editReply('This channel is not a text channel. Please try again.');
      }
      result = await sendToChannel(channel, parse(content));
    } else if (subcommand === 'user') {
      const user = interaction.options.getUser('target', true);
      result = await sendToUser(user, parse(content));
    }
    interaction.editReply(`Your message has been sent! Message ID: \`${result?.id}\``);
  }
}

function parse(message: string): string | MessagePayload | MessageOptions {
  if (message === 'rules') return rules;
  return message;
}

const rules = [
  '**__SERVER RULES__**',
  'This list does not constitute the full set of rules, and our Moderators may take' +
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
    'here: https://discord.com/guidelines',
].join('\n');
