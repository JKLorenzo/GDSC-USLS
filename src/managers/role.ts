import { CreateRoleOptions, Guild, GuildMember, Role } from 'discord.js';
import Queuer from '../utils/queuer.js';

const maxRoles = 250;
const queuer = new Queuer(500);

export function createRole(guild: Guild, data: CreateRoleOptions): Promise<Role | undefined> {
  return queuer.queue(async () => {
    if (guild.roles.cache.size >= maxRoles) return;
    const role = await guild.roles.create(data);
    return role;
  });
}

export function deleteRole(role: Role): Promise<void> {
  return queuer.queue(async () => {
    await role.delete();
  });
}

export function addRole(member: GuildMember, role: Role | Role[]): Promise<void> {
  return queuer.queue(async () => {
    await member.roles.add(role);
  });
}

export function removeRole(member: GuildMember, role: Role | Role[]): Promise<void> {
  return queuer.queue(async () => {
    await member.roles.remove(role);
  });
}
