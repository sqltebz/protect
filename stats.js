// ─────────────────────────────────────────────────────────────────────────────
//  MODULE STATS — Salons de statistiques en haut du serveur
//  Crée et met à jour des salons vocaux avec les stats du serveur
// ─────────────────────────────────────────────────────────────────────────────

const { ChannelType, PermissionsBitField } = require("discord.js");
const config = require("../config.js");

// Stocke les IDs des salons de stats une fois créés
const statsChannels = {
  members: null,
  online: null,
  voice: null,
  bots: null,
};

async function initStatsChannels(client) {
  const guild = client.guilds.cache.get(config.GUILD_ID);
  if (!guild) return;

  // Chercher si les salons existent déjà (par nom)
  for (const ch of guild.channels.cache.values()) {
    if (ch.name.startsWith("👥〃 Membres :")) statsChannels.members = ch.id;
    if (ch.name.startsWith("🟢〃 En ligne :")) statsChannels.online = ch.id;
    if (ch.name.startsWith("🔊〃 En vocal :")) statsChannels.voice = ch.id;
  }

  const category = config.STATS_CATEGORY_ID
    ? guild.channels.cache.get(config.STATS_CATEGORY_ID)
    : null;

  const createStatChannel = async (name, key) => {
    if (statsChannels[key]) return;
    try {
      const ch = await guild.channels.create({
        name,
        type: ChannelType.GuildVoice,
        parent: category?.id || null,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionsBitField.Flags.Connect], // personne peut rejoindre
            allow: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: client.user.id,
            allow: [
              PermissionsBitField.Flags.Connect,
              PermissionsBitField.Flags.ManageChannels,
            ],
          },
        ],
      });
      statsChannels[key] = ch.id;
      console.log(`📊 Salon stat créé : ${name}`);
    } catch (e) {
      console.error(`❌ Erreur création salon stat (${key}) :`, e.message);
    }
  };

  await createStatChannel("👥〃 Membres : 0", "members");
  await createStatChannel("🟢〃 En ligne : 0", "online");
  await createStatChannel("🔊〃 En vocal : 0", "voice");

  // Mise à jour immédiate
  await updateStatsChannels(client);
}

async function updateStatsChannels(client) {
  const guild = client.guilds.cache.get(config.GUILD_ID);
  if (!guild) return;

  // Fetch members pour avoir les presences à jour
  await guild.members.fetch().catch(() => {});

  const totalMembers = guild.members.cache.filter((m) => !m.user.bot).size;
  const onlineMembers = guild.members.cache.filter(
    (m) => !m.user.bot && m.presence?.status && m.presence.status !== "offline"
  ).size;
  const voiceMembers = guild.members.cache.filter(
    (m) => !m.user.bot && m.voice?.channelId
  ).size;
  const botCount = guild.members.cache.filter((m) => m.user.bot).size;

  const updates = [
    { key: "members", name: `👥〃 Membres : ${totalMembers}` },
    { key: "online", name: `🟢〃 En ligne : ${onlineMembers}` },
    { key: "voice", name: `🔊〃 En vocal : ${voiceMembers}` },
  ];

  for (const { key, name } of updates) {
    const channelId = statsChannels[key];
    if (!channelId) continue;

    const channel = guild.channels.cache.get(channelId);
    if (!channel) continue;
    if (channel.name === name) continue; // Pas de changement → pas d'edit inutile

    try {
      await channel.setName(name);
    } catch (e) {
      // Rate limit Discord sur les renommages : max 2 fois toutes les 10 minutes
      if (e.code !== 50013) {
        console.error(`❌ Update stat (${key}) :`, e.message);
      }
    }
  }
}

module.exports = { initStatsChannels, updateStatsChannels };
