const INVITE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:discord(?:\.gg|\.com\/invite|app\.com\/invite))\s*\/\s*([a-zA-Z0-9\-]{2,32})/gi;

async function check(message) {
  if (!INVITE_REGEX.test(message.content)) return false;
  INVITE_REGEX.lastIndex = 0;

  const matches = message.content.match(INVITE_REGEX);
  if (!matches) return false;

  for (const match of matches) {
    const code = match.split("/").pop().trim();
    try {
      const invite = await message.client.fetchInvite(code);
      if (invite.guild?.id === message.guild.id) continue;
    } catch (_) {}

    try { await message.delete(); } catch (_) {}

    const warn = await message.channel.send(
      `${message.author.username}, les invitations vers d'autres serveurs sont interdites.`
    );
    setTimeout(() => warn.delete().catch(() => {}), 5000);
    return true;
  }

  return false;
}

module.exports = { check };
