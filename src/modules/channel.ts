import { Guild, GuildChannel, GuildChannelCreateOptions } from 'discord.js';
import Queuer from '../utils/queuer.js';

const queuer = new Queuer(500);

type createOptions = { name: string } & GuildChannelCreateOptions;

export function createChannel(guild: Guild, data: createOptions): Promise<GuildChannel> {
  return queuer.queue(async () => {
    const channel = await guild.channels.create(data.name, data);
    return channel;
  });
}

export function deleteChannel(channel: GuildChannel): Promise<void> {
  return queuer.queue(async () => {
    if (channel.deletable) await channel.delete();
  });
}
