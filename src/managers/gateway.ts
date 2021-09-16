import { GuildMember } from 'discord.js';
import { logError } from './telemetry.js';
import { client } from '../main.js';
import { addRole } from '../modules/role.js';
import constants from '../utils/contants.js';

export function initGateway(): void {
  client.on('guildMemberAdd', member => {
    if (member.guild.id !== constants.guild) return;
    if (member.user.bot) processBot(member);
  });
}

// Add bot role to new bots
async function processBot(member: GuildMember): Promise<void> {
  try {
    const guild = client.guilds.cache.get(constants.guild);
    const botRole = guild?.roles.cache.get(constants.roles.bots);
    if (!member.user.bot) return;
    if (botRole) await addRole(member, botRole);
  } catch (error) {
    logError('Gateway', 'processBot', error);
  }
}
