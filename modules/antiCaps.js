const config = require("../config.js");

async function check(message) {
  const content = message.content.replace(/[^a-zA-Z]/g, "");
  if (content.length < config.CAPS_MIN_LENGTH) return false;

  const upperCount = (content.match(/[A-Z]/g) || []).length;
  const ratio = (upperCount / content.length) * 100;

  if (ratio >= config.CAPS_THRESHOLD) {
    try { await message.delete(); } catch (_) {}
    const warn = await message.channel.send(
      `${message.author.username}, evite les messages tout en majuscules.`
    );
    setTimeout(() => warn.delete().catch(() => {}), 5000);
    return true;
  }

  return false;
}

module.exports = { check };
