const config = require("../config.js");
const logger = require("./logger.js");

const warnDatabase = new Map();

async function punish(member, channel, action, reason, client) {
  if (!member) return;
  const tag = member.user.tag;

  switch (action) {
    case "warn":
      await warn(member, channel, reason, client);
      break;
    case "mute":
      await mute(member, channel, reason, client);
      break;
    case "kick":
      try {
        await member.kick(reason);
        await channel.send(`${tag} a ete expulse. Raison : ${reason}`);
        logger.log(client, `${tag} kick. Raison : ${reason}`);
      } catch (e) { console.error("Kick error:", e.message); }
      break;
    case "ban":
      try {
        await member.ban({ reason, deleteMessageSeconds: 86400 });
        await channel.send(`${tag} a ete banni. Raison : ${reason}`);
        logger.log(client, `${tag} banni. Raison : ${reason}`);
      } catch (e) { console.error("Ban error:", e.message); }
      break;
    default:
      await warn(member, channel, reason, client);
  }
}

async function warn(member, channel, reason, client) {
  const userId = member.user.id;
  const warns = warnDatabase.get(userId) || [];
  warns.push({ reason, date: new Date().toISOString() });
  warnDatabase.set(userId, warns);

  const msg = await channel.send(
    `${member.user.username} a recu un avertissement (${warns.length}/3). Raison : ${reason}`
  );
  setTimeout(() => msg.delete().catch(() => {}), 8000);
  logger.log(client, `${member.user.tag} averti (${warns.length}/3). Raison : ${reason}`);

  if (warns.length >= 3) {
    warnDatabase.set(userId, []);
    await mute(member, channel, "3 avertissements cumules", client);
  }
}

async function mute(member, channel, reason, client) {
  try {
    await member.timeout(config.DEFAULT_MUTE_DURATION, reason);
    const duration = config.DEFAULT_MUTE_DURATION / 60000;
    const msg = await channel.send(
      `${member.user.username} est mute pour ${duration} minutes. Raison : ${reason}`
    );
    setTimeout(() => msg.delete().catch(() => {}), 8000);
    logger.log(client, `${member.user.tag} mute ${duration}min. Raison : ${reason}`);
  } catch (e) { console.error("Mute error:", e.message); }
}

function getWarns(userId) { return warnDatabase.get(userId) || []; }
function clearWarns(userId) { warnDatabase.set(userId, []); }

module.exports = { punish, warn, mute, getWarns, clearWarns };
