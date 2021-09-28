import { GuildMember } from 'discord.js';
import { GDSCClient } from '../client.js';
import constants from '../utils/contants.js';

export default class GatewayManager {
  client: GDSCClient;

  constructor(client: GDSCClient) {
    this.client = client;

    client.on('guildMemberAdd', member => {
      if (member.guild.id !== constants.guild) return;
      if (member.user.bot) this.processBot(member);
    });
  }

  private async processBot(member: GuildMember): Promise<void> {
    try {
      if (!member.user.bot) return;
      const bot_role = this.client.role(constants.roles.bots);
      if (bot_role) await this.client.managers.role.add(member, bot_role);
    } catch (error) {
      this.client.managers.telemetry.logError('Gateway', 'Process Bot', error);
    }
  }
}
