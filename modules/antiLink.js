const config = require("../config.js");
const URL_REGEX = /https?:\/\/(?:www\.)?([a-zA-Z0-9\-]+\.[a-zA-Z]{2,})(?:\/[^\s]*)?/gi;

async function check(message) {
  const matches = [...message.content.matchAll(URL_REGEX)];
  if (matches.length === 0) return false;

  for (const match of matches) {
    const domain = match[1].toLowerCase();
    const isAllowed = config.ALLOWED_DOMAINS.some(
      (allowed) => domain === allowed || domain.endsWith("." + allowed)
    );

    if (!isAllowed) {
      try { await message.delete(); } catch (_) {}
      const warn = await message.channel.send(
        `${message.author.username}, ce lien n'est pas autorise ici.`
      );
      setTimeout(() => warn.delete().catch(() => {}), 5000);
      return true;
    }
  }

  return false;
}

module.exports = { check };
