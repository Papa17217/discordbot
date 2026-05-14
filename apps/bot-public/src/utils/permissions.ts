// ============================================
// Permission Checker
// ============================================

import { GuildMember, PermissionFlagsBits } from 'discord.js';
import { prisma } from './database';

export async function hasModPermission(member: GuildMember, guildDbId: string): Promise<boolean> {
  // Owner zawsze ma uprawnienia
  if (member.id === member.guild.ownerId) return true;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;

  // Sprawdź w konfiguracji
  const config = await prisma.guildConfig.findUnique({
    where: { guildId: guildDbId },
  });

  if (!config) return false;

  const hasModRole = member.roles.cache.some(
    (role) => config.modRoleIds.includes(role.id) || config.adminRoleIds.includes(role.id),
  );

  return hasModRole;
}

export async function hasAdminPermission(member: GuildMember, guildDbId: string): Promise<boolean> {
  if (member.id === member.guild.ownerId) return true;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;

  const config = await prisma.guildConfig.findUnique({
    where: { guildId: guildDbId },
  });

  if (!config) return false;

  return member.roles.cache.some((role) => config.adminRoleIds.includes(role.id));
}
