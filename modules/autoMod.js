const config = require("../config.js");
const warnCount = new Map();

async function check(message) {
  const content = message.content.toLowerCase();

  const foundWord = config.BANNED_WORDS.find((word) => {
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
    return regex.test(content);
  });

  if (!foundWord) return false;

  try { await message.delete(); } catch (_) {}

  const userId = message.author.id;
  const now = Date.now();
  const entry = warnCount.get(userId) || { count: 0, lastReset: now };

  if (now - entry.lastReset > 60 * 60 * 1000) {
    entry.count = 0;
    entry.lastReset = now;
  }

  entry.count++;
  warnCount.set(userId, entry);

  if (entry.count === 1) {
    const warn = await message.channel.send(
      `${message.author.username}, ce mot est interdit. Avertissement 1/3.`
    );
    setTimeout(() => warn.delete().catch(() => {}), 6000);
  } else if (entry.count === 2) {
    const warn = await message.channel.send(
      `${message.author.username}, dernier avertissement. 2/3.`
    );
    setTimeout(() => warn.delete().catch(() => {}), 6000);
  } else {
    const { punish } = require("./punish.js");
    await punish(
      message.member,
      message.channel,
      "mute",
      `Mot interdit repete (${entry.count} fois)`,
      message.client
    );
    entry.count = 0;
    warnCount.set(userId, entry);
  }

  return true;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = { check };
