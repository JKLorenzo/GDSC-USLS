import { GuildMember, MessageComponentInteraction } from 'discord.js';
import { client } from '../client.js';
import Component from '../structures/component.js';
import constants from '../utils/contants.js';
import { sleep } from '../utils/functions.js';
import Limiter from '../utils/limiter.js';

const limiter = new Limiter(60000);

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
    const member = interaction.member as GuildMember;
    if (member.roles.cache.hasAny(constants.roles.member, constants.roles.core_team)) {
      return interaction.reply({
        content: "You don't need to reapply for verification as you're already verified.",
        ephemeral: true,
      });
    }

    if (limiter.limit(interaction.user.id)) {
      return interaction.reply({
        content: 'You can only reapply for verification once every minute. Please try again later.',
        ephemeral: true,
      });
    }

    await interaction.deferUpdate();
    await client.managers.message.sendToUser(
      member,
      [
        `Hi ${member.user.username}! Welcome to the official community server of GDSC-USLS.`,
        'For verification purposes, we will ask you 4 questions ' +
          'and you will be given a minute to answer each question.',
      ].join('\n'),
    );

    let result,
      name = '',
      section = '',
      id = '';

    let retry = false,
      hasError = false,
      cancel = false;

    const dm = await member.createDM();
    await sleep(5000);

    do {
      retry = false;
      hasError = false;
      cancel = false;

      try {
        await dm.send('**1) Please enter your complete name.**');
        result = await dm.awaitMessages({
          max: 1,
          time: 60000,
          errors: ['time'],
        });
        if (result.size === 0) throw new Error();
        name = [...result.values()][0].content;

        await dm.send('**2) Please enter your year and section.**');
        result = await dm.awaitMessages({
          max: 1,
          time: 60000,
          errors: ['time'],
        });
        if (result.size === 0) throw new Error();
        section = [...result.values()][0].content;

        await dm.send('**3) Please enter your ID number.**');
        result = await dm.awaitMessages({
          max: 1,
          time: 60000,
          errors: ['time'],
        });
        if (result.size === 0) throw new Error();
        id = [...result.values()][0].content;
      } catch (error) {
        hasError = true;

        const retry_msg = await dm.send({
          content: 'You failed to answer the question on time. Would you like to try again?',
          components: [
            {
              type: 'ACTION_ROW',
              components: [
                {
                  customId: 'yes',
                  type: 'BUTTON',
                  label: 'Yes',
                  style: 'PRIMARY',
                },
                {
                  customId: 'no',
                  type: 'BUTTON',
                  label: 'No',
                  style: 'DANGER',
                },
              ],
            },
          ],
        });

        await dm
          .awaitMessageComponent({ componentType: 'BUTTON', time: 10000 })
          .then(res => {
            if (res.customId === 'yes') retry = true;
            if (res.customId === 'no') {
              cancel = true;
              dm.send('You have canceled this verification process.');
            }
          })
          .catch(() => {
            cancel = true;
            dm.send(
              'This verification process is automatically canceled. No response was received.',
            );
          });

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        if (retry_msg.deletable) await retry_msg.delete().catch(() => {});
      }

      if (!hasError) {
        const confirm_msg = await dm.send({
          embeds: [
            {
              author: { name: 'Google Developer Student Clubs - USLS' },
              title: 'Verification Form',
              thumbnail: { url: client.user?.displayAvatarURL() },
              description: "Please confirm if the information you've provided is correct.",
              fields: [
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
              ],
              color: 'BLURPLE',
            },
          ],
          components: [
            {
              type: 'ACTION_ROW',
              components: [
                {
                  customId: 'confirm',
                  type: 'BUTTON',
                  label: 'Confirm',
                  style: 'SUCCESS',
                },
                {
                  customId: 'retry',
                  type: 'BUTTON',
                  label: 'Retry',
                  style: 'PRIMARY',
                },
                {
                  customId: 'cancel',
                  type: 'BUTTON',
                  label: 'Cancel',
                  style: 'DANGER',
                },
              ],
            },
          ],
        });

        await dm
          .awaitMessageComponent({ componentType: 'BUTTON', time: 60000 })
          .then(res => {
            if (res.customId === 'retry') retry = true;
            if (res.customId === 'cancel') {
              cancel = true;
              dm.send('You have canceled this verification process.');
            }
          })
          .catch(() => {
            cancel = true;
            dm.send(
              'This verification process is automatically canceled. No response was received.',
            );
          });

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        if (confirm_msg.deletable) await confirm_msg.delete().then(() => {});
      }
      if (cancel) return;
    } while (retry);

    await dm.send("That's it! Please wait while our staff is reviewing your application.");
    await client.managers.message.sendToChannel(constants.channels.member_screening, {
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
          ],
          footer: {
            text: 'Apply actions by clicking the buttons below.',
          },
          color: 'BLURPLE',
        },
      ],
      components: client.managers.interaction.getComponent('screening'),
    });
  }
}
