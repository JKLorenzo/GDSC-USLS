import {
  GuildChannelResolvable,
  Message,
  MessageOptions,
  MessagePayload,
  TextChannel,
  UserResolvable,
} from 'discord.js';
import { client } from '../main.js';
import constants from '../utils/contants.js';
import Queuer from '../utils/queuer.js';

const queuer = new Queuer(500);

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
