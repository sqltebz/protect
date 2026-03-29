// ─────────────────────────────────────────────────────────────────────────────
//  CONFIG PRINCIPALE — Remplis chaque valeur avec tes IDs Discord
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  // ── TOKEN (mets-le dans les variables d'environnement sur Render, pas ici)
  TOKEN: process.env.TOKEN,

  // ── PREFIX des commandes
  PREFIX: "+",

  // ── IDs importants
  GUILD_ID: "1487433516752048222",              // ID de ton serveur
  LOG_CHANNEL_ID: "1487553897537999028",        // Salon pour les logs
  WELCOME_CHANNEL_ID: "1487553849303765014",
  BOT_VOICE_CHANNEL_ID: "1487554522275512382",  // Salon vocal du bot
  MOD_ROLE_ID: ["1487553761726693537", "1487553758324986129", "1487553753258262729"],  // Rôle modérateur
  ADMIN_ROLE_ID: ["1487553738796306643", "1487553747356745939", "1487553749936504856"],  // Rôle admin
  AUTO_ROLE_ID: "1487553778390532306",          // Rôle donné automatiquement à l'arrivée

  // ── Catégorie stats (le bot va créer des salons de stats dans cette catégorie)
  STATS_CATEGORY_ID: "1487553808459497534",

  // ── Anti-spam
  SPAM_THRESHOLD: 5,     // Nombre de msgs autorisés
  SPAM_INTERVAL: 5000,   // En ms (5 secondes)
  SPAM_ACTION: "mute",   // "mute" | "kick" | "ban" | "warn"

  // ── Anti-caps
  CAPS_THRESHOLD: 70,    // % de majuscules pour déclencher
  CAPS_MIN_LENGTH: 10,   // Longueur min du msg pour vérifier

  // ── Anti-mention
  MENTION_LIMIT: 5,      // Max de mentions dans un msg

  // ── Mute durée par défaut (en ms)
  DEFAULT_MUTE_DURATION: 10 * 60 * 1000, // 10 minutes

  // ── Mots interdits (en minuscule)
  BANNED_WORDS: [
    "ntm sql",
    // Ajoute tes mots ici
  ],

  // ── Domaines autorisés (les autres sont bloqués)
  ALLOWED_DOMAINS: [
    "discord.com",
    "discord.gg",
    "tenor.com",
    "giphy.com",
    "youtube.com",
    "youtu.be",
    "twitch.tv",
    "spotify.com",
    "imgur.com",
    "twitter.com",
    "x.com",
  ],
};
