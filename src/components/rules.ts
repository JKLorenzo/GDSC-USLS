import { MessageComponentInteraction } from 'discord.js';
import Component from '../structures/component.js';
import Limiter from '../utils/limiter.js';

const limiter = new Limiter(3600000);

export default class Rules extends Component {
  constructor() {
    super({
      name: 'rules',
      options: [
        {
          type: 'ACTION_ROW',
          components: [
            {
              customId: 'agree',
              type: 'BUTTON',
              label: 'I agree to all the rules specified above',
              style: 'SECONDARY',
            },
          ],
        },
      ],
    });
  }

  async exec(interaction: MessageComponentInteraction): Promise<void> {
    if (limiter.limit(interaction.user.id)) {
      await interaction.reply({
        content: 'Thank you for making this server a safe and friendly community!',
        ephemeral: true,
      });
    } else {
      await interaction.deferUpdate();
    }
  }
}
