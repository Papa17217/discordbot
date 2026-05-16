'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Crown, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useGuildStore } from '@/stores/guildStore';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/providers/LanguageProvider';

const anim = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

type GuildCard = {
  id: string;
  discordId: string;
  name: string;
  icon: string | null;
  memberCount: number;
  premium: boolean;
  botPresent: boolean;
  activeBotPresent?: boolean;
};

function getIconUrl(guildId: string, iconHash: string | null) {
  if (!iconHash) return null;
  return `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.png`;
}

export default function ServersPage() {
  const { guilds, isLoading, error, fetchGuilds } = useGuildStore();
  const activeBotType = useAuthStore((state) => state.activeBotType);
  const { t } = useTranslation();

  useEffect(() => {
    fetchGuilds();
  }, [fetchGuilds, activeBotType]);

  const activeBotLabel = activeBotType === 'PUBLIC' ? 'Publiczny bot' : 'Prywatny bot';
  const privateClientId =
    process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID_PRIVATE ||
    process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ||
    '';
  const publicClientId =
    process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID_PUBLIC ||
    process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ||
    '';

  const getInviteUrl = (guildId: string) => {
    const clientId = activeBotType === 'PUBLIC' ? publicClientId : privateClientId;
    return `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&integration_type=0&scope=bot+applications.commands&guild_id=${guildId}&disable_guild_select=true`;
  };

  const normalizedGuilds = (guilds as GuildCard[]).map((guild) => ({
    ...guild,
    activeBotPresent: guild.activeBotPresent ?? guild.botPresent,
  }));

  const connectedGuilds = normalizedGuilds.filter((guild) => guild.activeBotPresent);
  const inviteGuilds = normalizedGuilds.filter((guild) => !guild.activeBotPresent);

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
          <h2 className="text-xl font-bold text-rose-500 mb-2">Wystapil blad</h2>
          <p className="text-foreground-secondary">{error}</p>
          <button onClick={() => fetchGuilds()} className="btn-primary mt-4">
            Sprobuj ponownie
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
        <p className="text-sm text-accent mt-3">Aktualnie wybrany: {activeBotLabel}</p>
      </motion.div>

      {normalizedGuilds.length === 0 ? (
        <div className="py-12 text-center">
          <h3 className="text-lg font-medium">Brak serwerow</h3>
          <p className="text-foreground-secondary mt-1">Nie znaleziono zadnych serwerow, ktorymi zarzadzasz.</p>
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">{activeBotLabel} jest juz na tych serwerach</h2>
              <p className="text-sm text-foreground-secondary mt-1">
                Te pozycje powinny byc inne po przelaczeniu bota.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {connectedGuilds.length === 0 ? (
                <div className="col-span-full py-10 text-center text-foreground-secondary">
                  Ten bot nie jest jeszcze dodany na zadnym z Twoich serwerow.
                </div>
              ) : (
                connectedGuilds.map((guild) => (
                  <motion.div key={guild.id} variants={anim}>
                    <Link href={`/dashboard/servers/${guild.id}`}>
                      <div className="glass-card-hover p-6 relative overflow-hidden">
                        {guild.premium && (
                          <div className="absolute top-4 right-4 premium-badge">
                            <Crown className="w-3 h-3" /> Premium
                          </div>
                        )}
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent-secondary/20 flex items-center justify-center text-xl font-bold text-accent overflow-hidden shrink-0">
                            {guild.icon ? (
                              <img
                                src={getIconUrl(guild.discordId, guild.icon)!}
                                alt={guild.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              guild.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{guild.name}</h3>
                            <p className="text-sm text-foreground-secondary flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" /> {guild.memberCount} czlonkow
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-status-success">
                          <span className="status-dot-online" /> Bot aktywny
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Dodaj {activeBotLabel.toLowerCase()} na te serwery</h2>
              <p className="text-sm text-foreground-secondary mt-1">
                Tu sa serwery, na ktorych wybranego bota jeszcze nie ma.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {inviteGuilds.length === 0 ? (
                <div className="col-span-full py-10 text-center text-foreground-secondary">
                  Nie ma juz zadnych serwerow oczekujacych na dodanie tego bota.
                </div>
              ) : (
                inviteGuilds.map((guild) => (
                  <motion.div key={guild.id} variants={anim}>
                    <Link href={getInviteUrl(guild.discordId)} target="_blank">
                      <div className="glass-card-hover p-6 relative overflow-hidden opacity-80">
                        {guild.premium && (
                          <div className="absolute top-4 right-4 premium-badge">
                            <Crown className="w-3 h-3" /> Premium
                          </div>
                        )}
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent-secondary/20 flex items-center justify-center text-xl font-bold text-accent overflow-hidden shrink-0">
                            {guild.icon ? (
                              <img
                                src={getIconUrl(guild.discordId, guild.icon)!}
                                alt={guild.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              guild.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{guild.name}</h3>
                            <p className="text-sm text-foreground-secondary flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" /> {guild.memberCount} czlonkow
                            </p>
                          </div>
                        </div>
                        <button className="btn-primary w-full text-sm py-2.5 flex items-center justify-center gap-2">
                          <Plus className="w-4 h-4" /> Dodaj tego bota
                        </button>
                      </div>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </motion.div>
  );
}
