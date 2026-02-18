const express = require("express");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const path = require("path");

const app = express();
const PORT = 3000;

let sock;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      console.log("Scan this QR code with WhatsApp:", qr);
    }

    if (connection === "open") {
      console.log("✅ WhatsApp Connected");
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== 401) {
        console.log("Reconnecting...");
        startBot();
      } else {
        console.log("Logged out from WhatsApp");
      }
    }
  });

  // Simple auto reply
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text;

    if (text && text.toLowerCase() === "hi") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "Hello 👋 I am your WhatsApp bot"
      });
    }
  });
}

startBot();

// Serve HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pair.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
