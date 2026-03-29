// Commandes de moderation — prefixe + — texte simple, pas d'embed

const { PermissionsBitField } = require("discord.js");
const config = require("../config.js");
const { punish, getWarns, clearWarns } = require("./punish.js");
const logger = require("./logger.js");

async function handle(message, client) {
  const args = message.content.slice(config.PREFIX.length).trim().split(/\s+/);
  const cmd = args.shift().toLowerCase();

  const isStaff =
    message.member.permissions.has(PermissionsBitField.Flags.ManageMessages) ||
    message.member.roles.cache.has(config.MOD_ROLE_ID) ||
    message.member.roles.cache.has(config.ADMIN_ROLE_ID);

  const isAdmin =
    message.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    message.member.roles.cache.has(config.ADMIN_ROLE_ID);

  // HELP
  if (cmd === "help") {
    return message.channel.send(
      "**Commandes disponibles**\n\n" +
      "+ping\n" +
      "+userinfo @user\n" +
      "+serverinfo\n" +
      "+avatar @user\n" +
      "+roleinfo @role\n\n" +
      "**Moderation (staff)**\n\n" +
      "+warn @user [raison]\n" +
      "+warns @user\n" +
      "+clearwarns @user\n" +
      "+mute @user [minutes] [raison]\n" +
      "+unmute @user\n" +
      "+kick @user [raison]\n" +
      "+ban @user [raison]\n" +
      "+unban [userId]\n" +
      "+clear [1-100]\n" +
      "+slowmode [secondes]\n" +
      "+lock\n" +
      "+unlock"
    );
  }

  // PING
  if (cmd === "ping") {
    const sent = await message.channel.send("...");
    const latency = sent.createdTimestamp - message.createdTimestamp;
    return sent.edit(`Pong. Bot : ${latency}ms | WebSocket : ${client.ws.ping}ms`);
  }

  // --- Commandes staff ---
  if (!isStaff) {
    const m = await message.channel.send("Tu n'as pas la permission.");
    setTimeout(() => m.delete().catch(() => {}), 4000);
    return;
  }

  // WARN
  if (cmd === "warn") {
    const target = message.mentions.members.first();
    if (!target) return message.channel.send("Mentionne un membre.");
    const reason = args.slice(1).join(" ") || "Aucune raison";
    await punish(target, message.channel, "warn", reason, client);
    return;
  }

  // WARNS
  if (cmd === "warns") {
    const target = message.mentions.members.first();
    if (!target) return message.channel.send("Mentionne un membre.");
    const warns = getWarns(target.user.id);
    if (warns.length === 0) return message.channel.send(`${target.user.username} n'a aucun avertissement.`);
    const list = warns.map((w, i) => `${i + 1}. ${w.reason}`).join("\n");
    return message.channel.send(`Avertissements de ${target.user.username} (${warns.length}/3) :\n${list}`);
  }

  // CLEARWARNS
  if (cmd === "clearwarns") {
    const target = message.mentions.members.first();
    if (!target) return message.channel.send("Mentionne un membre.");
    clearWarns(target.user.id);
    return message.channel.send(`Warns de ${target.user.username} effaces.`);
  }

  // MUTE
  if (cmd === "mute") {
    const target = message.mentions.members.first();
    if (!target) return message.channel.send("Mentionne un membre.");
    const duration = parseInt(args[1]) || 10;
    const reason = args.slice(2).join(" ") || "Aucune raison";
    try {
      await target.timeout(duration * 60 * 1000, reason);
      message.channel.send(`${target.user.username} mute ${duration} minutes. Raison : ${reason}`);
      logger.log(client, `${target.user.tag} mute ${duration}min par ${message.author.tag}. Raison : ${reason}`);
    } catch (e) {
      message.channel.send(`Impossible de mute : ${e.message}`);
    }
    return;
  }

  // UNMUTE
  if (cmd === "unmute") {
    const target = message.mentions.members.first();
    if (!target) return message.channel.send("Mentionne un membre.");
    try {
      await target.timeout(null);
      message.channel.send(`${target.user.username} n'est plus mute.`);
      logger.log(client, `${target.user.tag} unmute par ${message.author.tag}.`);
    } catch (e) {
      message.channel.send(`Impossible d'unmute : ${e.message}`);
    }
    return;
  }

  // KICK
  if (cmd === "kick") {
    const target = message.mentions.members.first();
    if (!target) return message.channel.send("Mentionne un membre.");
    if (!target.kickable) return message.channel.send("Je ne peux pas kick ce membre.");
    const reason = args.slice(1).join(" ") || "Aucune raison";
    try {
      await target.kick(reason);
      message.channel.send(`${target.user.tag} a ete expulse. Raison : ${reason}`);
      logger.log(client, `${target.user.tag} kick par ${message.author.tag}. Raison : ${reason}`);
    } catch (e) {
      message.channel.send(`Impossible de kick : ${e.message}`);
    }
    return;
  }

  // BAN
  if (cmd === "ban") {
    if (!isAdmin) return message.channel.send("Permission insuffisante (admin requis).");
    const target = message.mentions.members.first();
    if (!target) return message.channel.send("Mentionne un membre.");
    if (!target.bannable) return message.channel.send("Je ne peux pas bannir ce membre.");
    const reason = args.slice(1).join(" ") || "Aucune raison";
    try {
      await target.ban({ reason, deleteMessageSeconds: 86400 });
      message.channel.send(`${target.user.tag} a ete banni. Raison : ${reason}`);
      logger.log(client, `${target.user.tag} banni par ${message.author.tag}. Raison : ${reason}`);
    } catch (e) {
      message.channel.send(`Impossible de ban : ${e.message}`);
    }
    return;
  }

  // UNBAN
  if (cmd === "unban") {
    if (!isAdmin) return message.channel.send("Permission insuffisante (admin requis).");
    const userId = args[0];
    if (!userId) return message.channel.send("Fournis un ID utilisateur.");
    try {
      await message.guild.members.unban(userId);
      message.channel.send(`Utilisateur ${userId} debanni.`);
      logger.log(client, `${userId} debanni par ${message.author.tag}.`);
    } catch (e) {
      message.channel.send(`Impossible de debannir : ${e.message}`);
    }
    return;
  }

  // PURGE
  if (cmd === "clear") {
    const amount = parseInt(args[0]);
    if (!amount || amount < 1 || amount > 100) return message.channel.send("Indique un nombre entre 1 et 100.");
    try {
      const deleted = await message.channel.bulkDelete(amount + 1, true);
      const m = await message.channel.send(`${deleted.size - 1} messages supprimes.`);
      setTimeout(() => m.delete().catch(() => {}), 3000);
      logger.log(client, `${deleted.size - 1} msgs clear dans #${message.channel.name} par ${message.author.tag}.`);
    } catch (e) {
      message.channel.send(`Erreur clear : ${e.message}`);
    }
    return;
  }

  // SLOWMODE
  if (cmd === "slowmode") {
    const seconds = parseInt(args[0]);
    if (isNaN(seconds) || seconds < 0 || seconds > 21600) return message.channel.send("Entre 0 et 21600 secondes.");
    try {
      await message.channel.setRateLimitPerUser(seconds);
      message.channel.send(seconds === 0 ? "Slowmode desactive." : `Slowmode : ${seconds}s.`);
    } catch (e) {
      message.channel.send(`Erreur slowmode : ${e.message}`);
    }
    return;
  }

  // LOCK
  if (cmd === "lock") {
    try {
      await message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: false });
      message.channel.send(`Salon verrouille par ${message.author.username}.`);
      logger.log(client, `#${message.channel.name} verrouille par ${message.author.tag}.`);
    } catch (e) {
      message.channel.send(`Erreur lock : ${e.message}`);
    }
    return;
  }

  // UNLOCK
  if (cmd === "unlock") {
    try {
      await message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: null });
      message.channel.send(`Salon deverrouille par ${message.author.username}.`);
      logger.log(client, `#${message.channel.name} deverrouille par ${message.author.tag}.`);
    } catch (e) {
      message.channel.send(`Erreur unlock : ${e.message}`);
    }
    return;
  }

  // USERINFO
  if (cmd === "userinfo") {
    const target = message.mentions.members.first() || message.member;
    const warns = getWarns(target.user.id);
    const roles = target.roles.cache
      .filter((r) => r.id !== message.guild.id)
      .map((r) => r.name)
      .join(", ") || "Aucun";

    return message.channel.send(
      `**${target.user.tag}**\n` +
      `ID : ${target.user.id}\n` +
      `Compte cree : ${target.user.createdAt.toLocaleDateString("fr-FR")}\n` +
      `A rejoint : ${target.joinedAt?.toLocaleDateString("fr-FR") || "Inconnu"}\n` +
      `Warns : ${warns.length}/3\n` +
      `Roles : ${roles.substring(0, 300)}`
    );
  }

  // SERVERINFO
  if (cmd === "serverinfo") {
    const guild = message.guild;
    const owner = await guild.fetchOwner();
    const bots = guild.members.cache.filter((m) => m.user.bot).size;
    const humans = guild.memberCount - bots;

    return message.channel.send(
      `**${guild.name}**\n` +
      `ID : ${guild.id}\n` +
      `Proprio : ${owner.user.tag}\n` +
      `Cree le : ${guild.createdAt.toLocaleDateString("fr-FR")}\n` +
      `Membres : ${humans} humains, ${bots} bots\n` +
      `Boosts : ${guild.premiumSubscriptionCount || 0} (niveau ${guild.premiumTier})`
    );
  }

  // AVATAR
  if (cmd === "avatar") {
    const target = message.mentions.users.first() || message.author;
    return message.channel.send(
      `Avatar de ${target.tag} :\n${target.displayAvatarURL({ size: 512, extension: "png" })}`
    );
  }

  // ROLEINFO
  if (cmd === "roleinfo") {
    const role = message.mentions.roles.first();
    if (!role) return message.channel.send("Mentionne un role.");
    return message.channel.send(
      `**${role.name}**\n` +
      `ID : ${role.id}\n` +
      `Membres : ${role.members.size}\n` +
      `Couleur : ${role.hexColor}\n` +
      `Position : ${role.position}\n` +
      `Mentionnable : ${role.mentionable ? "Oui" : "Non"}`
    );
  }
}

module.exports = { handle };
