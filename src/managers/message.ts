import {
  CategoryChannel,
  GuildChannelResolvable,
  GuildMember,
  Message,
  MessageOptions,
  MessagePayload,
  TextChannel,
  UserResolvable,
} from 'discord.js';
import { GDSCClient } from '../client.js';
import constants from '../utils/contants.js';
import { hasAll, hasAny, parseMention } from '../utils/functions.js';
import Queuer from '../utils/queuer.js';

export default class MessageManager {
  client: GDSCClient;
  queuer: Queuer;

  constructor(client: GDSCClient) {
    this.client = client;
    this.queuer = new Queuer(500);

    client.on('messageCreate', message => {
      if (message.author.bot) return;

      const guild = message.guild;
      const channel = message.channel as TextChannel;

      if (!guild) return this.processIncomingDM(message);
      if (guild.id !== constants.guild) return;

      switch (channel.parentId) {
        case constants.categories.information:
          return this.processInformationMessage(message);
        case constants.categories.bot_dms:
          return this.processOutgoingDM(message);
      }
    });
  }

  async init(): Promise<void> {
    await this.client.guild.members.fetch({ force: true });
  }

  sendToChannel(
    channel: GuildChannelResolvable,
    data: string | MessagePayload | MessageOptions,
  ): Promise<Message | undefined> {
    return this.queuer.queue(async () => {
      const this_channel = this.client.channel(channel);
      if (this_channel?.isText()) {
        const result = await this_channel.send(data);
        return result;
      }
    });
  }

  sendToUser(
    user: UserResolvable,
    data: string | MessagePayload | MessageOptions,
  ): Promise<Message | undefined> {
    return this.queuer.queue(async () => {
      const member = this.client.member(user);
      const result = await member?.send(data);
      return result;
    });
  }

  private async processInformationMessage(message: Message): Promise<void> {
    try {
      const channel = message.channel as TextChannel;

      const data = {
        content: message.content.length ? message.content : null,
        files: [...message.attachments.values()],
      } as MessageOptions;

      if (message.reference?.messageId) {
        data.reply = {
          messageReference: message.reference.messageId,
          failIfNotExists: false,
        };
      }

      await this.sendToChannel(channel, data);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      message.delete().catch(() => {});
    } catch (error) {
      this.client.managers.telemetry.logError('Message', 'Process Information Message', error);
    }
  }

  private async processIncomingDM(message: Message): Promise<void> {
    try {
      const member = this.client.member(message.author.id);
      if (!member) return;
      const dm_category = this.client.channel(constants.categories.bot_dms) as CategoryChannel;
      const dm_channel =
        dm_category.children.find(
          c => c instanceof TextChannel && hasAny(c.topic ?? '*', member.toString()),
        ) ??
        (await this.client.managers.channel.create({
          name: member.displayName,
          parent: dm_category.id,
          topic:
            `Direct message handler for ${member.toString()}. ` +
            'You can reply to this user by sending a message to this channel.',
        }));

      if (dm_channel.name !== member.displayName) {
        await dm_channel.setName(member.displayName);
      }

      if (dm_channel.position !== 0) {
        await dm_channel.setPosition(0);
      }

      if (dm_category.children.size > 5) {
        dm_category.children
          .filter(c => c.position > 4)
          .forEach(c => {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            this.client.managers.channel.delete(c).catch(() => {});
          });
      }

      await this.sendToChannel(dm_channel, {
        content: message.content.length ? message.content : null,
        files: [...message.attachments.values()],
      });
    } catch (error) {
      this.client.managers.telemetry.logError('Message', 'Process Incoming DM', error);
    }
  }

  private async processOutgoingDM(message: Message): Promise<void> {
    try {
      const channel = message.channel as TextChannel;
      const topic = channel.topic ?? '';
      const member = topic
        .split(' ')
        .filter(s => hasAll(s, ['<', '>']))
        .map(s => this.client.member(parseMention(s)))
        .filter(s => s instanceof GuildMember)[0];
      if (!member) return;

      const reply = await this.sendToUser(member, {
        content: message.content.length ? message.content : null,
        files: [...message.attachments.values()],
      });
      if (reply) await message.react('✅');
    } catch (error) {
      this.client.managers.telemetry.logError('Message', 'Process Outgoing DM', error);
    }
  }
}
