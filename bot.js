const {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
  ChannelType,
  AuditLogEvent,
  ActivityType,
} = require("discord.js");

const config = require("./config.js");
const antiSpam = require("./modules/antiSpam.js");
const antiInvite = require("./modules/antiInvite.js");
const antiLink = require("./modules/antiLink.js");
const antiCaps = require("./modules/antiCaps.js");
const antiMention = require("./modules/antiMention.js");
const autoMod = require("./modules/autoMod.js");
const welcome = require("./modules/welcome.js");
const stats = require("./modules/stats.js");
const commands = require("./modules/commands.js");
const logger = require("./modules/logger.js");
const { keepAlive } = require("./server.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember],
});

// ─────────────────────────────────────────────
//  READY
// ─────────────────────────────────────────────
client.once("ready", async () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);

  // Statut rotatif
  const statuses = [
    { name: "le serveur 👁️", type: ActivityType.Watching },
    { name: `${client.guilds.cache.first()?.memberCount || 0} membres`, type: ActivityType.Watching },
    { name: "la modération 🔨", type: ActivityType.Playing },
  ];

  let i = 0;
  const updateStatus = () => {
    client.user.setActivity(statuses[i % statuses.length].name, {
      type: statuses[i % statuses.length].type,
    });
    i++;
  };
  updateStatus();
  setInterval(updateStatus, 15000);

  // Initialisation des salons de stats
  await stats.initStatsChannels(client);

  // Mise à jour des stats toutes les 5 min
  setInterval(() => stats.updateStatsChannels(client), 5 * 60 * 1000);

  // Connexion vocal auto
  await connectToVoice(client);

  logger.log(client, "🟢 Bot démarré et prêt !");
});

// ─────────────────────────────────────────────
//  CONNEXION VOCALE AUTO
// ─────────────────────────────────────────────
async function connectToVoice(client) {
  try {
    const guild = client.guilds.cache.get(config.GUILD_ID);
    if (!guild) return;

    const voiceChannel = guild.channels.cache.get(config.BOT_VOICE_CHANNEL_ID);
    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      console.log("⚠️ Salon vocal non trouvé ou mauvais type.");
      return;
    }

    const { joinVoiceChannel } = require("@discordjs/voice");
    joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: true,
    });

    console.log(`🔊 Connecté au salon vocal : ${voiceChannel.name}`);
  } catch (err) {
    console.error("❌ Erreur connexion vocale :", err.message);
  }
}

// ─────────────────────────────────────────────
//  MESSAGES
// ─────────────────────────────────────────────
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const member = message.member;
  const isStaff = member?.permissions.has(PermissionsBitField.Flags.ManageMessages);

  // Staff bypass modération auto
  if (!isStaff) {
    // Anti-invite Discord
    if (await antiInvite.check(message)) return;

    // Anti-lien externe
    if (await antiLink.check(message)) return;

    // Anti-spam
    if (await antiSpam.check(message)) return;

    // Anti-caps excessif
    if (await antiCaps.check(message)) return;

    // Anti-mention masse
    if (await antiMention.check(message)) return;

    // AutoMod mots interdits
    if (await autoMod.check(message)) return;
  }

  // Commandes préfixées
  if (message.content.startsWith(config.PREFIX)) {
    await commands.handle(message, client);
  }
});

// ─────────────────────────────────────────────
//  MEMBRE REJOINT
// ─────────────────────────────────────────────
client.on("guildMemberAdd", async (member) => {
  await welcome.sendWelcome(member, client);
  await stats.updateStatsChannels(client);

  // Auto-rôle
  if (config.AUTO_ROLE_ID) {
    const role = member.guild.roles.cache.get(config.AUTO_ROLE_ID);
    if (role) {
      try {
        await member.roles.add(role);
      } catch (e) {
        console.error("❌ Erreur auto-rôle :", e.message);
      }
    }
  }

  logger.log(client, `📥 **${member.user.tag}** a rejoint le serveur. (${member.guild.memberCount} membres)`);
});

// ─────────────────────────────────────────────
//  MEMBRE PART
// ─────────────────────────────────────────────
client.on("guildMemberRemove", async (member) => {
  await stats.updateStatsChannels(client);

  const leaveChannel = member.guild.channels.cache.get(config.LOG_CHANNEL_ID);
  if (leaveChannel) {
    leaveChannel.send(
      `👋 **${member.user.tag}** a quitté le serveur. Il restait **${member.guild.memberCount}** membres.`
    );
  }

  logger.log(client, `📤 **${member.user.tag}** a quitté le serveur.`);
});

// ─────────────────────────────────────────────
//  VOCAL STATE (rejoindre/quitter vocal)
// ─────────────────────────────────────────────
client.on("voiceStateUpdate", async (oldState, newState) => {
  await stats.updateStatsChannels(client);

  // Si le bot est kicked du vocal, on le reconnecte
  if (
    oldState.channelId === config.BOT_VOICE_CHANNEL_ID &&
    !newState.channelId &&
    oldState.member?.id === client.user.id
  ) {
    setTimeout(() => connectToVoice(client), 3000);
  }
});

// ─────────────────────────────────────────────
//  MESSAGE SUPPRIMÉ
// ─────────────────────────────────────────────
client.on("messageDelete", async (message) => {
  if (message.author?.bot) return;
  if (!message.guild) return;

  const logChannel = message.guild.channels.cache.get(config.LOG_CHANNEL_ID);
  if (!logChannel) return;

  const content = message.content || "[contenu inconnu / fichier]";
  logChannel.send(
    `🗑️ Message supprimé dans <#${message.channelId}>\n` +
    `**Auteur :** ${message.author?.tag || "Inconnu"}\n` +
    `**Contenu :** ${content.substring(0, 1000)}`
  );
});

// ─────────────────────────────────────────────
//  MESSAGE ÉDITÉ
// ─────────────────────────────────────────────
client.on("messageUpdate", async (oldMsg, newMsg) => {
  if (oldMsg.author?.bot) return;
  if (!oldMsg.guild) return;
  if (oldMsg.content === newMsg.content) return;

  const logChannel = oldMsg.guild.channels.cache.get(config.LOG_CHANNEL_ID);
  if (!logChannel) return;

  logChannel.send(
    `✏️ Message édité dans <#${oldMsg.channelId}>\n` +
    `**Auteur :** ${oldMsg.author?.tag}\n` +
    `**Avant :** ${(oldMsg.content || "?").substring(0, 500)}\n` +
    `**Après :** ${(newMsg.content || "?").substring(0, 500)}`
  );
});

// ─────────────────────────────────────────────
//  BAN / UNBAN
// ─────────────────────────────────────────────
client.on("guildBanAdd", async (ban) => {
  logger.log(client, `🔨 **${ban.user.tag}** a été banni du serveur.`);
});

client.on("guildBanRemove", async (ban) => {
  logger.log(client, `✅ **${ban.user.tag}** a été débanni du serveur.`);
});

// ─────────────────────────────────────────────
//  ERREURS GLOBALES
// ─────────────────────────────────────────────
client.on("error", (error) => {
  console.error("❌ Erreur client Discord :", error.message);
});

process.on("unhandledRejection", (reason) => {
  console.error("⚠️ Promesse rejetée non gérée :", reason);
});

process.on("uncaughtException", (err) => {
  console.error("💥 Exception non capturée :", err.message);
});

// ─────────────────────────────────────────────
//  DÉMARRAGE
// ─────────────────────────────────────────────
keepAlive(); // Serveur web pour Render
client.login(config.TOKEN);
