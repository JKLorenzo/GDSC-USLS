import { Snowflake } from 'discord-api-types';
import { Guild } from 'discord.js';

export type CommandPermissionData = {
  allow?: Snowflake[];
  deny?: Snowflake[];
};

export type GuildCommandOptions = {
  guilds?(guild: Guild): Promise<boolean> | boolean;
  permissions?: {
    users?: CommandPermissionData;
    roles?: CommandPermissionData;
  };
};
