import fs from 'fs';
import path from 'path';
import { Snowflake } from 'discord.js';

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).reduce<string[]>((list, file) => {
    const name = path.join(dir, file);
    const isDir = fs.statSync(name).isDirectory();
    return list.concat(isDir ? getFiles(name) : [name]);
  }, []);
}

export function hasAny(base: string, part: string | string[]): boolean {
  const parts = Array.isArray(part) ? part : [part];
  for (const this_part of parts) {
    if (base.indexOf(this_part) !== -1) return true;
  }
  return false;
}

export function hasAll(base: string, parts: string[]): boolean {
  for (const this_part of parts) {
    if (!hasAny(base, this_part)) return false;
  }
  return true;
}

export function parseMention(mention: string): Snowflake {
  return String(mention).replace(/\W/g, '');
}
