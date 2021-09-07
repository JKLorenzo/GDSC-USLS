import { client } from '../main.js';
import { addRole } from '../modules/role.js';
import { logError } from '../modules/telemetry.js';
import constants from '../utils/contants.js';

export async function initGateway(): Promise<void> {
  const guild = client.guilds.cache.get(constants.guild);
  const memberRole = guild?.roles.cache.get(constants.roles.member);
  const botRole = guild?.roles.cache.get(constants.roles.bots);

  try {
    // Add member role to all non-pending members
    for (const member of guild?.members.cache.values() ?? []) {
      if (member.user.bot) continue;
      if (memberRole && !member.roles.cache.has(memberRole.id)) {
        await addRole(member, memberRole);
      }
    }

    // Add bot role to all existing bots
    for (const member of guild?.members.cache.values() ?? []) {
      if (!member.user.bot) continue;
      if (botRole && !member.roles.cache.has(botRole.id)) {
        await addRole(member, botRole);
      }
    }
  } catch (error) {
    logError('Gateway', 'Initialize', error);
  }

  // Add member role to members who are no longer pending
  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    try {
      if (newMember.guild.id !== constants.guild) return;
      if (newMember.user.bot) return;
      if (!oldMember.pending || newMember.pending) return;

      if (memberRole && !newMember.roles.cache.has(memberRole.id)) {
        await addRole(newMember, memberRole);
      }
    } catch (error) {
      logError('Gateway', 'Guild Member Update', error);
    }
  });

  // Add bot role to new bots
  client.on('guildMemberAdd', async member => {
    try {
      if (member.guild.id !== constants.guild) return;
      if (!member.user.bot) return;
      if (botRole) await addRole(member, botRole);
    } catch (error) {
      logError('Gateway', 'Guild Member Add', error);
    }
  });
}
