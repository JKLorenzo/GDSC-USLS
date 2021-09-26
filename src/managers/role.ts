import { CreateRoleOptions, GuildMember, Role } from 'discord.js';
import { client } from '../main.js';
import constants from '../utils/contants.js';
import Queuer from '../utils/queuer.js';

const maxRoles = 250;
const queuer = new Queuer(500);

export function createRole(data: CreateRoleOptions): Promise<Role | undefined> {
  return queuer.queue(async () => {
    const guild = client.guilds.cache.get(constants.guild)!;
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
