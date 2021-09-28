import {
  Client,
  Guild,
  GuildChannel,
  GuildChannelResolvable,
  GuildMember,
  GuildMemberResolvable,
  Intents,
  Role,
  RoleResolvable,
  ThreadChannel,
} from 'discord.js';
import ChannelManager from './managers/channel.js';
import GatewayManager from './managers/gateway.js';
import InteractionManager from './managers/interaction.js';
import MessageManager from './managers/message.js';
import RoleManager from './managers/role.js';
import TelemetryManager from './managers/telemetry.js';
import constants from './utils/contants.js';

export class GDSCClient extends Client {
  managers: {
    channel: ChannelManager;
    gateway: GatewayManager;
    interaction: InteractionManager;
    message: MessageManager;
    role: RoleManager;
    telemetry: TelemetryManager;
  };

  constructor() {
    super({
      allowedMentions: {
        parse: ['everyone', 'roles', 'users'],
        repliedUser: true,
      },
      intents: [
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
      ],
      partials: ['CHANNEL'],
      presence: {
        activities: [
          {
            name: '/',
            type: 'LISTENING',
          },
        ],
        status: 'online',
        afk: false,
      },
    });

    this.managers = {
      channel: new ChannelManager(this),
      gateway: new GatewayManager(this),
      interaction: new InteractionManager(this),
      role: new RoleManager(this),
      message: new MessageManager(this),
      telemetry: new TelemetryManager(this),
    };

    this.on('ready', async () => {
      console.log('Online');
      await this.managers.telemetry.init();
      await this.managers.interaction.init();
      await this.managers.message.init();
      console.log('Initialized');
    });

    this.login(process.env.BOT_TOKEN!);
  }

  get guild(): Guild {
    return this.guilds.cache.get(constants.guild)!;
  }

  member(resolvable: GuildMemberResolvable): GuildMember | null {
    return this.guild.members.resolve(resolvable);
  }

  channel(resolvable: GuildChannelResolvable): GuildChannel | ThreadChannel | null {
    return this.guild.channels.resolve(resolvable);
  }

  role(resolvable: RoleResolvable): Role | null {
    return this.guild.roles.resolve(resolvable);
  }
}

export const client = new GDSCClient();
