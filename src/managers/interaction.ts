import { join } from 'path';
import { pathToFileURL } from 'url';
import Discord, {
  Collection,
  CommandInteraction,
  MessageActionRowOptions,
  MessageComponentInteraction,
} from 'discord.js';
import { GDSCClient } from '../client.js';
import Command from '../structures/command.js';
import Component from '../structures/component.js';
import { getFiles } from '../utils/functions.js';

export default class InteractionManager {
  client: GDSCClient;
  commands: Collection<string, Command>;
  components: Collection<string, Component>;

  constructor(client: GDSCClient) {
    this.client = client;
    this.commands = new Collection();
    this.components = new Collection();

    client.on('interactionCreate', interaction => {
      if (interaction.isCommand() || interaction.isContextMenu()) {
        return this.processCommand(interaction);
      } else if (interaction.isMessageComponent()) {
        return this.processComponent(interaction);
      }
    });
  }

  async init(): Promise<void> {
    try {
      // Load components
      const components_dir = join(process.cwd(), 'dist/components');
      for (const component_path of getFiles(components_dir)) {
        if (component_path.endsWith('.map')) continue;
        const file_path = pathToFileURL(component_path).href;
        const { default: MessageComponent } = await import(file_path);
        const component = new MessageComponent() as Component;
        this.components.set(component.name, component);
      }

      // Load commands
      const commands_dir = join(process.cwd(), 'dist/commands');
      for (const command_path of getFiles(commands_dir)) {
        if (command_path.endsWith('.map')) continue;
        const file_path = pathToFileURL(command_path).href;
        const { default: ApplicationCommand } = await import(file_path);
        const command = new ApplicationCommand() as Command;
        this.commands.set(command.data.name, command);
      }

      // Initialize commands
      await this.client.application?.commands.fetch();
      for (const command of this.commands.values()) {
        await command.init();
      }

      // Delete invalid commands
      const promises = [] as Promise<Discord.ApplicationCommand>[];

      this.client.application?.commands.cache
        .filter(cmd => !this.commands.some(c => c.data.name === cmd.name && c.scope === 'global'))
        .forEach(cmd => promises.push(cmd.delete()));

      this.client.guilds.cache.forEach(guild =>
        guild.commands.cache
          .filter(cmd => !this.commands.some(c => c.data.name === cmd.name && c.scope === 'guild'))
          .forEach(cmd => promises.push(cmd.delete())),
      );

      const deleted_commands = await Promise.all(promises);
      for (const command of deleted_commands) {
        if (command.guildId) {
          this.client.managers.telemetry.logMessage(
            'Interaction',
            'Initialize',
            `Guild Command ${command.name} deleted on ${command.guild}`,
          );
        } else {
          this.client.managers.telemetry.logMessage(
            'Interaction',
            'Initialize',
            `Global Command ${command.name} deleted`,
          );
        }
      }
    } catch (error) {
      this.client.managers.telemetry.logError('Interaction', 'Initialize', error);
    }
  }

  getComponent(name: string): MessageActionRowOptions[] | undefined {
    return this.components.get(name)?.options;
  }

  private async processCommand(interaction: CommandInteraction): Promise<void> {
    const this_command = this.commands.get(interaction.commandName);
    if (!this_command) return;
    try {
      await this_command.exec(interaction);
    } catch (error) {
      this.client.managers.telemetry.logError('Interaction', 'Process Command', error);
    }
  }

  private async processComponent(interaction: MessageComponentInteraction): Promise<void> {
    const [name, customId] = interaction.customId.split('__');
    const this_component = this.components.get(name);
    if (!this_component) return;
    try {
      await this_component.exec(interaction, customId);
    } catch (error) {
      this.client.managers.telemetry.logError('Interaction', 'Process Component', error);
    }
  }
}
