import { GuildChannel, GuildChannelCreateOptions } from 'discord.js';
import { client } from '../main.js';
import constants from '../utils/contants.js';
import Queuer from '../utils/queuer.js';

const queuer = new Queuer(500);

type createOptions = { name: string } & GuildChannelCreateOptions;

export function createChannel(data: createOptions): Promise<GuildChannel> {
  return queuer.queue(async () => {
    const guild = client.guilds.cache.get(constants.guild)!;
    const channel = await guild.channels.create(data.name, data);
    return channel;
  });
}

export function deleteChannel(channel: GuildChannel): Promise<void> {
  return queuer.queue(async () => {
    if (channel.deletable) await channel.delete();
  });
}
