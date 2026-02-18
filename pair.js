const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@adiwajshing/baileys");

const pino = require("pino");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    auth: state,
    printQRInTerminal: true // QR enable
  });

  // Pairing code option
  if (!sock.authState.creds.registered) {
    rl.question("Enter your WhatsApp number (with country code): ", async (number) => {
      const code = await sock.requestPairingCode(number);
      console.log("Your Pairing Code:", code);
    });
  }

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        startBot();
      } else {
        console.log("Logged out.");
      }
    } else if (connection === "open") {
      console.log("✅ Bot connected to WhatsApp");
    }
  });

  sock.ev.on("creds.update", saveCreds);

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
