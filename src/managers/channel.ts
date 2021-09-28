import { GuildChannel, GuildChannelCreateOptions } from 'discord.js';
import { GDSCClient } from '../client.js';
import Queuer from '../utils/queuer.js';

type createOptions = { name: string } & GuildChannelCreateOptions;

export default class ChannelManager {
  client: GDSCClient;
  queuer: Queuer;

  constructor(client: GDSCClient) {
    this.client = client;
    this.queuer = new Queuer(500);
  }

  create(data: createOptions): Promise<GuildChannel> {
    return this.queuer.queue(async () => {
      const channel = await this.client.guild.channels.create(data.name, data);
      return channel;
    });
  }

  delete(channel: GuildChannel): Promise<void> {
    return this.queuer.queue(async () => {
      if (channel.deletable) await channel.delete();
    });
  }
}
