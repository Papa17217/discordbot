'use client';

import { motion } from 'framer-motion';
import { Server, Plus, Users, Crown } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/providers/LanguageProvider';

import { useEffect } from 'react';
import { useGuildStore } from '@/stores/guildStore';
import { useAuthStore } from '@/stores/authStore';
import { Loader2, AlertCircle } from 'lucide-react';

const anim = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function ServersPage() {
  const { guilds, isLoading, error, fetchGuilds } = useGuildStore();
  const activeBotType = useAuthStore((state) => state.activeBotType);
  const { t } = useTranslation();

  useEffect(() => {
    fetchGuilds();
  }, [fetchGuilds, activeBotType]);

  const getInviteUrl = (guildId: string) => {
    const privateClientId =
      process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID_PRIVATE ||
      process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ||
      '';
    const publicClientId =
      process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID_PUBLIC ||
      process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ||
      '';
    const clientId = activeBotType === 'PUBLIC' ? publicClientId : privateClientId;
    return `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&integration_type=0&scope=bot+applications.commands&guild_id=${guildId}&disable_guild_select=true`;
  };

  const getIconUrl = (guildId: string, iconHash: string | null) => {
    if (!iconHash) return null;
    return `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.png`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-foreground-secondary">{t.common.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-rose-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-rose-500 mb-2">Wystąpił błąd</h2>
          <p className="text-foreground-secondary">{error}</p>
          <button onClick={() => fetchGuilds()} className="btn-primary mt-4">
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.08 }} className="space-y-8">
      <motion.div variants={anim}>
        <h1 className="text-3xl font-bold">{t.sidebar.servers}</h1>
        <p className="text-foreground-secondary mt-1">{t.dashboard.selectServer}</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {guilds.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <h3 className="text-lg font-medium">Brak serwerów</h3>
            <p className="text-foreground-secondary mt-1">Nie znaleziono żadnych serwerów, którymi zarządzasz.</p>
          </div>
        ) : guilds.map((guild) => {
          const activeBotPresent = guild.activeBotPresent ?? guild.botPresent;

          return (
          <motion.div key={guild.id} variants={anim}>
            <Link href={activeBotPresent ? `/dashboard/servers/${guild.id}` : getInviteUrl(guild.discordId)} target={activeBotPresent ? "_self" : "_blank"}>
              <div className={cn('glass-card-hover p-6 relative overflow-hidden', !activeBotPresent && 'opacity-60')}>
                {guild.premium && (
                  <div className="absolute top-4 right-4 premium-badge">
                    <Crown className="w-3 h-3" /> Premium
                  </div>
                )}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent-secondary/20 flex items-center justify-center text-xl font-bold text-accent overflow-hidden shrink-0">
                    {guild.icon ? (
                      <img src={getIconUrl(guild.discordId, guild.icon)!} alt={guild.name} className="w-full h-full object-cover" />
                    ) : (
                      guild.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{guild.name}</h3>
                    <p className="text-sm text-foreground-secondary flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {guild.memberCount} członków
                    </p>
                  </div>
                </div>
                {activeBotPresent ? (
                  <div className="flex items-center gap-2 text-sm text-status-success">
                    <span className="status-dot-online" /> Bot aktywny
                  </div>
                ) : (
                  <button className="btn-primary w-full text-sm py-2.5 flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Dodaj tego bota
                  </button>
                )}
              </div>
            </Link>
          </motion.div>
        )})}
      </div>
    </motion.div>
  );
}
