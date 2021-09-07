import { client } from '../main.js';
import { addRole } from '../modules/role.js';
import { logError } from '../modules/telemetry.js';
import constants from '../utils/contants.js';

export async function initGateway(): Promise<void> {
  try {
    const guild = client.guilds.cache.get(constants.guild);
    const memberRole = guild?.roles.cache.get(constants.roles.member);

    // Add member role to all non-pending members
    for (const member of guild?.members.cache.values() ?? []) {
      if (memberRole && !member.roles.cache.has(memberRole.id)) {
        await addRole(member, memberRole);
      }
    }

    // Add member role to members who are no longer pending
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
      try {
        if (!oldMember.pending || newMember.pending) return;

        if (memberRole && !newMember.roles.cache.has(memberRole.id)) {
          await addRole(newMember, memberRole);
        }
      } catch (error) {
        logError('Gateway', 'Guild Member Update', error);
      }
    });
  } catch (error) {
    logError('Gateway', 'Initialize', error);
  }
}
