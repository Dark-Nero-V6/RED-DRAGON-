const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");
let router = express.Router();
const pino = require("pino");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  delay,
  makeCacheableSignalKeyStore,
  Browsers,
  jidNormalizedUser,
} = require("@whiskeysockets/baileys");
const { upload } = require("./mega");

function removeFile(FilePath) {
  if (!fs.existsSync(FilePath)) return false;
  fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get("/", async (req, res) => {
  let num = req.query.number;
  async function RASHPair() {
    const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    try {
      let RASHPairWeb = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(
            state.keys,
            pino({ level: "fatal" }).child({ level: "fatal" })
          ),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }).child({ level: "fatal" }),
        browser: Browsers.macOS("Safari"),
      });

      if (!RASHPairWeb.authState.creds.registered) {
        await delay(1500);
        num = num.replace(/[^0-9]/g, "");
        const code = await RASHPairWeb.requestPairingCode(num);
        if (!res.headersSent) {
          await res.send({ code });
        }
      }

      RASHPairWeb.ev.on("creds.update", saveCreds);
      RASHPairWeb.ev.on("connection.update", async (s) => {
        const { connection, lastDisconnect } = s;
        if (connection === "open") {
          try {
            await delay(10000);
            const sessionPrabath = fs.readFileSync("./session/creds.json");

            const auth_path = "./session/";
            const user_jid = jidNormalizedUser(RASHPairWeb.user.id);

            function randomMegaId(length = 6, numberLength = 4) {
              const characters =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
              let result = "";
              for (let i = 0; i < length; i++) {
                result += characters.charAt(
                  Math.floor(Math.random() * characters.length)
                );
              }
              const number = Math.floor(
                Math.random() * Math.pow(10, numberLength)
              );
              return `${result}${number}`;
            }

            const mega_url = await upload(
              fs.createReadStream(auth_path + "creds.json"),
              `${randomMegaId()}.json`
            );

            const string_session = mega_url.replace(
              "https://mega.nz/file/",
              ""
            );

            const sid = `*RED DRAGON V 1.0.0*\n\n*OWNER-SASIDU RASHMIKA\n\n*This is the your Session ID, copy this id and paste into config.js file*\n\n*You can ask any question *`;
            const mg = `🛑 *Do not share this code to anyone* 🛑`;
            const dt = await RASHPairWeb.sendMessage(user_jid, {
              image: {
                url: "https://github.com/Dark-Nero-V6/Dark-Nero-V7/blob/main/Images/Picsart_26-02-19_12-23-51-713.jpg?raw=true",
              },
              caption: sid,
            });
            const msg = await RASHPairWeb.sendMessage(user_jid, {
              text: string_session,
            });
            const msg1 = await RASHPairWeb.sendMessage(user_jid, { text: mg });
          } catch (e) {
            exec("pm2 restart prabath");
          }

          await delay(100);
          return await removeFile("./session");
          process.exit(0);
        } else if (
          connection === "close" &&
          lastDisconnect &&
          lastDisconnect.error &&
          lastDisconnect.error.output.statusCode !== 401
        ) {
          await delay(10000);
          RASHPair();
        }
      });
    } catch (err) {
      exec("pm2 restart RASH-md");
      console.log("service restarted");
      RASHPair();
      await removeFile("./session");
      if (!res.headersSent) {
        await res.send({ code: "Service Unavailable" });
      }
    }
  }
  return await RASHPair();
});

process.on("uncaughtException", function (err) {
  console.log("Caught exception: " + err);
  exec("pm2 restart RASH");
});

module.exports = router;


