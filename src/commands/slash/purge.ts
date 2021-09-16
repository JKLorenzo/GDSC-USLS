import { CommandInteraction, Message, MessageEmbed, Snowflake, TextChannel } from 'discord.js';
import Command from '../../structures/command.js';
import constants from '../../utils/contants.js';
import { sleep } from '../../utils/functions.js';

export default class Purge extends Command {
  constructor() {
    super(
      'guild',
      {
        name: 'purge',
        description: 'Removes a number of messages on the current channel.',
        type: 'CHAT_INPUT',
        defaultPermission: false,
        options: [
          {
            name: 'message_count',
            description: '[Core] The number of messages to delete.',
            type: 'INTEGER',
            required: true,
          },
        ],
      },
      {
        permissions: {
          roles: {
            allow: [constants.roles.core],
          },
        },
      },
    );
  }

  async exec(interaction: CommandInteraction): Promise<void> {
    const channel = interaction.channel as TextChannel;
    const message_count = interaction.options.getInteger('message_count', true);

    await interaction.deferReply({ ephemeral: true });

    let retries = 3;
    let deleted_count = 0;
    const deleted = new Map<string, number>();

    do {
      const messages_to_delete = [] as Message[];
      const authors = new Map<Snowflake, string>();
      await channel.messages.fetch().then(messages => {
        for (const this_message of messages.values()) {
          if (this_message.deletable) {
            messages_to_delete.push(this_message);
            authors.set(this_message.id, this_message?.author.toString() ?? 'Unavailable');
          }
          if (messages_to_delete.length >= message_count) break;
        }
      });
      if (messages_to_delete) {
        await channel.bulkDelete(messages_to_delete, true).then(messages => {
          for (const this_message of messages.values()) {
            deleted_count++;
            const author = authors.get(this_message.id);
            if (!author) continue;
            const msgs = deleted.get(author) ?? 0;
            deleted.set(author, msgs + 1);
          }
        });
      }
      retries--;
      if (retries > 0 && deleted_count < message_count) await sleep(5000);
    } while (retries > 0 && deleted_count < message_count);

    const elapsedTime = (Date.now() - interaction.createdTimestamp) / 1000;
    const affected = [] as string[];
    for (const elements of deleted) {
      affected.push(`${elements[0]}: ${elements[1]}`);
    }

    await interaction.editReply({
      embeds: [
        new MessageEmbed({
          author: { name: 'Channel Message Cleanup' },
          title: 'Purge Complete',
          description: `A total of ${deleted_count} messages were removed.`,
          fields: [
            {
              name: 'Affected Authors:',
              value: affected.length ? affected.join('\n') : 'None',
            },
          ],
          footer: {
            text: `This process took ${elapsedTime.toFixed(2)} seconds to finish.`,
          },
          timestamp: new Date(),
          color: '#FFFF00',
        }),
      ],
    });
  }
}
