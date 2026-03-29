const config = require("../config.js");
const { punish } = require("./punish.js");

async function check(message) {
  const mentionCount =
    message.mentions.users.size +
    message.mentions.roles.size +
    (message.mentions.everyone ? 1 : 0);

  if (mentionCount < config.MENTION_LIMIT) return false;

  try { await message.delete(); } catch (_) {}

  const reason = `Anti-mention : ${mentionCount} mentions dans un message`;
  await punish(message.member, message.channel, "mute", reason, message.client);
  return true;
}

module.exports = { check };
