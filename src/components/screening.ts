import { Guild, MessageComponentInteraction, MessageEmbed } from 'discord.js';
import { client } from '../client.js';
import Component from '../structures/component.js';
import constants from '../utils/contants.js';
import { parseMention } from '../utils/functions.js';

export default class Screening extends Component {
  constructor() {
    super({
      name: 'screening',
      options: [
        {
          type: 'ACTION_ROW',
          components: [
            {
              customId: 'approve',
              type: 'BUTTON',
              label: 'Approve',
              style: 'SUCCESS',
            },
            {
              customId: 'kick',
              type: 'BUTTON',
              label: 'Kick',
              style: 'DANGER',
            },
            {
              customId: 'ban',
              type: 'BUTTON',
              label: 'Ban',
              style: 'DANGER',
            },
          ],
        },
      ],
    });
  }

  async exec(interaction: MessageComponentInteraction, customId: string): Promise<void> {
    const guild = interaction.guild as Guild;
    const embed = interaction.message.embeds[0] as MessageEmbed;
    const member = guild.members.cache.get(parseMention(embed.fields[0].value));
    const fullname = embed.fields[1].value;
    const member_role = guild.roles.cache.get(constants.roles.member)!;

    if (!member) {
      return interaction.reply({
        content: 'This user is no longer in the server.',
        ephemeral: true,
      });
    }

    switch (customId) {
      case 'approve': {
        await client.managers.role.add(member, member_role);
        await member.setNickname(fullname);
        embed.addField('Action:', `Approved by ${interaction.member}`);
        break;
      }
      case 'kick': {
        await member.kick();
        embed.addField('Action:', `Kicked by ${interaction.member}`);
        break;
      }
      case 'ban': {
        await member.ban();
        embed.addField('Action:', `Banned by ${interaction.member}`);
        break;
      }
    }

    await interaction.update({
      embeds: [embed.setFooter('').setTimestamp()],
      components: [],
    });
  }
}
