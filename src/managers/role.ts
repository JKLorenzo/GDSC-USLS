import { CreateRoleOptions, GuildMember, Role } from 'discord.js';
import { GDSCClient } from '../client.js';
import Queuer from '../utils/queuer.js';

export default class RoleManager {
  client: GDSCClient;
  queuer: Queuer;
  max = 250;

  constructor(client: GDSCClient) {
    this.client = client;
    this.queuer = new Queuer(500);
  }

  create(data: CreateRoleOptions): Promise<Role | undefined> {
    return this.queuer.queue(async () => {
      if (this.client.guild.roles.cache.size >= this.max) return;
      const role = await this.client.guild.roles.create(data);
      return role;
    });
  }

  delete(role: Role): Promise<void> {
    return this.queuer.queue(async () => {
      await role.delete();
    });
  }

  add(member: GuildMember, roleOrRoles: Role | Role[]): Promise<void> {
    return this.queuer.queue(async () => {
      await member.roles.add(roleOrRoles);
    });
  }

  remove(member: GuildMember, roleOrRoles: Role | Role[]): Promise<void> {
    return this.queuer.queue(async () => {
      await member.roles.remove(roleOrRoles);
    });
  }
}
