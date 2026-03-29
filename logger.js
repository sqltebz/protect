const config = require("../config.js");

function getTimestamp() {
  return new Date().toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

async function log(client, message) {
  const guild = client.guilds.cache.get(config.GUILD_ID);
  if (!guild) return;
  const logChannel = guild.channels.cache.get(config.LOG_CHANNEL_ID);
  if (!logChannel) return;
  try {
    await logChannel.send(`[${getTimestamp()}] ${message}`);
  } catch (e) {
    console.error("Logger error :", e.message);
  }
}

module.exports = { log };
