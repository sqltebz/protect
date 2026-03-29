// ─────────────────────────────────────────────────────────────────────────────
//  SERVEUR WEB — Pour héberger le bot sur Render (Web Service)
//  Render kill les process qui n'ont pas de serveur HTTP actif
// ─────────────────────────────────────────────────────────────────────────────

const http = require("http");

function keepAlive() {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Bot Discord opérationnel ✅");
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Serveur web actif sur le port ${PORT}`);
  });

  // Ping automatique pour éviter que Render endorme le service
  // (Si tu as le plan gratuit, utilise UptimeRobot pour pinger cette URL)
  return server;
}

module.exports = { keepAlive };
