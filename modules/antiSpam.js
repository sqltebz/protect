// ─────────────────────────────────────────────────────────────────────────────
//  MODULE ANTI-SPAM
//  Détecte les messages envoyés trop rapidement et agit en conséquence
// ─────────────────────────────────────────────────────────────────────────────

const config = require("../config.js");
const { punish } = require("./punish.js");

// Map : userId => { count, timer, messages[] }
const spamMap = new Map();

// Durée de suppression progressive selon les avertissements
const WARN_COOLDOWN = 30 * 1000; // 30s entre deux avertissements
const warnCooldown = new Map();

async function check(message) {
  const userId = message.author.id;
  const now = Date.now();

  if (!spamMap.has(userId)) {
    spamMap.set(userId, { count: 0, firstMsg: now, messages: [] });
  }

  const data = spamMap.get(userId);
  data.count++;
  data.messages.push(message);

  // Reset si la fenêtre est expirée
  if (now - data.firstMsg > config.SPAM_INTERVAL) {
    data.count = 1;
    data.firstMsg = now;
    data.messages = [message];
    return false;
  }

  if (data.count >= config.SPAM_THRESHOLD) {
    // Supprimer tous les messages spam
    for (const msg of data.messages) {
      try {
        await msg.delete();
      } catch (_) {}
    }

    // Reset
    spamMap.set(userId, { count: 0, firstMsg: now, messages: [] });

    // Cooldown pour pas spam le même user avec des avertissements
    const lastWarn = warnCooldown.get(userId) || 0;
    if (now - lastWarn < WARN_COOLDOWN) return true;
    warnCooldown.set(userId, now);

    // Punition
    const reason = "Anti-spam : trop de messages envoyés rapidement";
    await punish(message.member, message.channel, config.SPAM_ACTION, reason, message.client);

    return true;
  }

  return false;
}

module.exports = { check };
