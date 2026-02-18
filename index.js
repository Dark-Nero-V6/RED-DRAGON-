const express = require("express");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require("@adiwajshing/baileys");

const pino = require("pino");

const app = express();
const PORT = 3000;

let sock;

// Start WhatsApp
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    auth: state
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    if (update.connection === "open") {
      console.log("✅ WhatsApp Connected");
    }
  });
}

startBot();

// Pair API
app.get("/pair", async (req, res) => {
  const number = req.query.number;

  if (!number) {
    return res.json({ code: "Enter number" });
  }

  try {
    const code = await sock.requestPairingCode(number);
    res.json({ code });
  } catch (e) {
    res.json({ code: "Error generating code" });
  }
});

// Serve HTML
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/pair.html");
});

app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});
