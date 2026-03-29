const config = require("../config.js");

async function sendWelcome(member, client) {
  const guild = member.guild;
  const channel = guild.channels.cache.get(config.WELCOME_CHANNEL_ID);
  if (!channel) return;

  const memberCount = guild.memberCount;
  const userId = member.user.id;

  const message =
    `Bienvenue <@${userId}> sur **${guild.name}**.\n` +
    `Tu es le **${memberCount}eme** membre du serveur.\n` +
    `Lis le reglement et bonne arrivee.`;

  try {
    await channel.send(message);
  } catch (e) {
    console.error("Erreur welcome :", e.message);
  }
}

module.exports = { sendWelcome };
