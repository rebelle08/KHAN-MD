const { cmd } = require("../command");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const { execSync } = require("child_process");
const config = require("../config");

const HEROKU_APP_NAME = config.HEROKU_APP_NAME;
const HEROKU_API_KEY = config.HEROKU_API_KEY;

cmd({
  pattern: "update",
  alias: ["upgrade", "sync"],
  react: "🆕",
  desc: "Update the bot to the latest version permanently.",
  category: "misc",
  filename: __filename,
}, async (client, message, args, { reply, isOwner }) => {
  if (!isOwner) {
    return reply("This command is only for the bot owner.");
  }

  if (!HEROKU_APP_NAME || !HEROKU_API_KEY) {
    return reply("❌ Heroku API Key or App Name is missing in config.js.");
  }

  try {
    await reply("```🔍 Checking for KHAN-MD updates...```");

    // Get latest commit from GitHub
    const { data: commitData } = await axios.get("https://api.github.com/repos/JawadYTX/KHAN-MD/commits/main");
    const latestCommitHash = commitData.sha;

    // Get current commit hash
    let currentHash = "unknown";
    try {
      const packageJson = require("../package.json");
      currentHash = packageJson.commitHash || "unknown";
    } catch (error) {
      console.error("Error reading package.json:", error);
    }

    if (latestCommitHash === currentHash) {
      return reply("```✅ Your KHAN-MD bot is already up-to-date!```");
    }

    await reply("```KHAN-MD Bot Updating...🚀```");

    // Download latest code
    const zipPath = path.join(__dirname, "latest.zip");
    const { data: zipData } = await axios.get(
      "https://github.com/JawadYTX/KHAN-MD/archive/main.zip",
      { responseType: "arraybuffer" }
    );
    fs.writeFileSync(zipPath, zipData);

    await reply("```📦 Extracting the latest code...```");

    // Extract ZIP file
    const extractPath = path.join(__dirname, "latest");
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);

    await reply("```🔄 Replacing files...```");

    // Copy updated files, skipping config.js and app.json
    const sourcePath = path.join(extractPath, "KHAN-MD-main");
    const destinationPath = path.join(__dirname, "..");
    copyFolderSync(sourcePath, destinationPath);

    // Cleanup
    fs.unlinkSync(zipPath);
    fs.rmSync(extractPath, { recursive: true, force: true });

    // Deploy to Heroku using API
    await reply("```🚀 Deploying update to Heroku...```");
    deployToHeroku();

    await reply("```✅ Update complete! Restarting bot...```");
  } catch (error) {
    console.error("Update error:", error);
    reply("❌ Update failed. Please try manually.");
  }
});

// Helper function to copy directories while skipping config.js and app.json
function copyFolderSync(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const items = fs.readdirSync(source);
  for (const item of items) {
    const srcPath = path.join(source, item);
    const destPath = path.join(target, item);

    // Skip config.js and app.json to preserve custom settings
    if (item === "config.js" || item === "app.json") {
      console.log(`Skipping ${item} to preserve custom settings.`);
      continue;
    }

    if (fs.lstatSync(srcPath).isDirectory()) {
      copyFolderSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Deploy bot to Heroku without GitHub connection
async function deployToHeroku() {
  try {
    await axios.post(
      `https://api.heroku.com/apps/${HEROKU_APP_NAME}/dynos`,
      { command: "restart" },
      {
        headers: {
          "Accept": "application/vnd.heroku+json; version=3",
          "Authorization": `Bearer ${HEROKU_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    console.log("✅ Bot restarted on Heroku.");
  } catch (error) {
    console.error("❌ Failed to restart bot on Heroku:", error);
  }
}
