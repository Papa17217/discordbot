// ============================================
// Custom Embed Builder
// ============================================

import { EmbedBuilder, ColorResolvable } from 'discord.js';
import { COLORS } from '@discord-saas/shared';

export class Embed extends EmbedBuilder {
  constructor() {
    super();
    this.setColor(COLORS.EMBED_DEFAULT as ColorResolvable);
    this.setTimestamp();
  }

  static success(title: string, description?: string) {
    return new Embed()
      .setColor(COLORS.EMBED_SUCCESS as ColorResolvable)
      .setTitle(`✅ ${title}`)
      .setDescription(description || null);
  }

  static error(title: string, description?: string) {
    return new Embed()
      .setColor(COLORS.EMBED_ERROR as ColorResolvable)
      .setTitle(`❌ ${title}`)
      .setDescription(description || null);
  }

  static warning(title: string, description?: string) {
    return new Embed()
      .setColor(COLORS.EMBED_WARNING as ColorResolvable)
      .setTitle(`⚠️ ${title}`)
      .setDescription(description || null);
  }

  static info(title: string, description?: string) {
    return new Embed()
      .setColor(COLORS.EMBED_INFO as ColorResolvable)
      .setTitle(`ℹ️ ${title}`)
      .setDescription(description || null);
  }
}
