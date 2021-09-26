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
import { createChannel, deleteChannel } from './channel.js';
import { logError } from './telemetry.js';
import { client } from '../main.js';
import constants from '../utils/contants.js';
import { hasAll, hasAny, parseMention } from '../utils/functions.js';
import Queuer from '../utils/queuer.js';

const queuer = new Queuer(500);

export function initMessage(): void {
  client.on('messageCreate', message => {
    if (message.author.bot) return;

    const guild = message.guild;
    const channel = message.channel as TextChannel;

    if (!guild) return processIncomingDM(message);
    if (guild.id !== constants.guild) return;
    if (channel.parentId !== constants.channels.bot_dms) return;
    return processOutgoingDM(message);
  });
}

async function processIncomingDM(message: Message): Promise<void> {
  try {
    const guild = client.guilds.cache.get(constants.guild)!;
    const member = guild.members.cache.get(message.author.id);
    if (!member) return;
    const dm_category = guild.channels.cache.get(constants.channels.bot_dms) as CategoryChannel;
    const dm_channel =
      dm_category.children.find(
        c => c instanceof TextChannel && hasAny(c.topic ?? '*', member.toString()),
      ) ??
      (await createChannel({
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
          deleteChannel(c).catch(() => {});
        });
    }

    await sendToChannel(dm_channel, {
      content: message.content.length ? message.content : null,
      files: [...message.attachments.values()],
    });
  } catch (error) {
    logError('Message', 'Process Incoming DM', error);
  }
}

async function processOutgoingDM(message: Message): Promise<void> {
  try {
    const guild = client.guilds.cache.get(constants.guild)!;
    const channel = message.channel as TextChannel;
    const topic = channel.topic ?? '';
    const member = topic
      .split(' ')
      .filter(s => hasAll(s, ['<', '>']))
      .map(s => guild.members.cache.get(parseMention(s)))
      .filter(s => s instanceof GuildMember)[0];
    if (!member) return;

    const reply = await sendToUser(member, {
      content: message.content.length ? message.content : null,
      files: [...message.attachments.values()],
    });
    if (reply) await message.react('✅');
  } catch (error) {
    logError('Message', 'Process Outgoing DM', error);
  }
}

export function sendToChannel(
  channel: GuildChannelResolvable,
  message: string | MessagePayload | MessageOptions,
): Promise<Message | undefined> {
  const guild = client.guilds.cache.get(constants.guild);
  return queuer.queue(async () => {
    const this_channel = guild?.channels.resolve(channel);
    if (this_channel instanceof TextChannel) {
      const result = await this_channel.send(message);
      return result;
    }
  });
}

export function sendToUser(
  user: UserResolvable,
  message: string | MessagePayload | MessageOptions,
): Promise<Message | undefined> {
  return queuer.queue(async () => {
    const this_user = client.users.resolve(user);
    const result = await this_user?.send(message);
    return result;
  });
}
