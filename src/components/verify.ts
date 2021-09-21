import { GuildMember, MessageComponentInteraction } from 'discord.js';
import { getComponent } from '../managers/interaction.js';
import { sendToChannel, sendToUser } from '../modules/message.js';
import Component from '../structures/component.js';
import constants from '../utils/contants.js';
import Limiter from '../utils/limiter.js';

const limiter = new Limiter(300000);

export default class Verify extends Component {
  constructor() {
    super({
      name: 'verify',
      options: [
        {
          type: 'ACTION_ROW',
          components: [
            {
              customId: 'verify',
              type: 'BUTTON',
              label: 'Get Started',
              style: 'SECONDARY',
            },
          ],
        },
      ],
    });
  }

  async exec(interaction: MessageComponentInteraction): Promise<unknown> {
    if (limiter.limit(interaction.user.id)) return interaction.deferUpdate();

    const member = interaction.member as GuildMember;
    if (member.roles.cache.hasAny(constants.roles.member, constants.roles.core)) {
      return interaction.reply({
        content: "You don't need to reapply for verification as you're already verified.",
        ephemeral: true,
      });
    }

    await interaction.deferUpdate();
    await sendToUser(
      member,
      [
        `Hi ${member.user.username}, and welcome to the official community server of GDSC-USLS!`,
        'You will be asked to answer a total of 4 questions, and you are given 30 seconds to answer each question.',
      ].join('\n'),
    );

    let result, name, section, id, nickname;

    const dm = await member.createDM();
    try {
      await dm.send('**1) Please enter your complete name.**');
      result = await dm.awaitMessages({
        max: 1,
        time: 30000,
        errors: ['time'],
      });
      if (result.size === 0) throw new Error();
      name = [...result.values()][0].content;

      await dm.send('**2) Please enter your year and section.**');
      result = await dm.awaitMessages({
        max: 1,
        time: 30000,
        errors: ['time'],
      });
      if (result.size === 0) throw new Error();
      section = [...result.values()][0].content;

      await dm.send('**3) Please enter your ID number.**');
      result = await dm.awaitMessages({
        max: 1,
        time: 30000,
        errors: ['time'],
      });
      if (result.size === 0) throw new Error();
      id = [...result.values()][0].content;

      await dm.send('**4) Please enter your preferred nickname.**');
      result = await dm.awaitMessages({
        max: 1,
        time: 30000,
        errors: ['time'],
      });
      if (result.size === 0) throw new Error();
      nickname = [...result.values()][0].content;
    } catch (error) {
      return dm.send(
        'You failed to answer the question on time. Please try again after 5 minutes.',
      );
    }

    await dm.send("That's it! Please wait while our staff is reviewing your application.");

    await sendToChannel(constants.channels.member_screening, {
      embeds: [
        {
          author: { name: 'Google Developer Student Clubs - USLS' },
          title: 'Member Screening',
          thumbnail: { url: member.user.displayAvatarURL() },
          fields: [
            {
              name: 'Profile:',
              value: member.toString(),
            },
            {
              name: 'Full Name:',
              value: name,
            },
            {
              name: 'Year and Section:',
              value: section,
            },
            {
              name: 'ID Number:',
              value: id,
            },
            {
              name: 'Preferred Nickname:',
              value: nickname,
            },
          ],
          footer: {
            text: 'Apply actions by clicking the buttons below.',
          },
          color: 'BLURPLE',
        },
      ],
      components: getComponent('screening'),
    });
  }
}