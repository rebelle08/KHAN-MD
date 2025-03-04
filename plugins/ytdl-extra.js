const { cmd } = require("../command");
const yts = require("yt-search");
const axios = require("axios");

cmd({
  pattern: "yt",
  alias: ["youtube", "jk"],
  desc: "Download YouTube videos",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, quoted, args, q, reply }) => {
  try {
    if (!q) {
      return reply("🚨 *Please provide a YouTube URL or search term!*");
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    let videoURL;
    if (q.startsWith("https://")) {
      videoURL = q;
    } else {
      const searchResults = await yts(q);
      if (!searchResults.videos.length) {
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        return reply("❌ *No results found!*");
      }
      videoURL = searchResults.videos[0].url;
    }

    const apiUrl = `https://velyn.vercel.app/api/downloader/ytmp4?url=${videoURL}`;
    const { data } = await axios.get(apiUrl);
    if (!data.status) {
      await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
      return reply("❌ *Failed to fetch video!*");
    }

    const videoData = data.data;

    const caption = `🎬 *YOUTUBE DOWNLOADER* 💸\n`
      + `────────────────────\n`
      + `📌 *Title:* ${videoData.title}\n`
      + `🕒 *Duration:* ${videoData.duration}\n`
      + `👀 *Views:* ${videoData.views}\n`
      + `🔗 *Link:* ${videoURL}\n`
      + `────────────────────\n\n`
      + `📥 *Choose Your Format:* ⬇️\n`
      + `1️⃣ *Video (MP4)* 📹\n`
      + `2️⃣ *Audio (MP3)* 🎵\n`
      + `3️⃣ *Voice Note (OGG)* 🎙️\n`
      + `4️⃣ *Document (MP4)* 📄\n\n`
      + `⚡ *Reply with the number to download*`;

    const sentMsg = await conn.sendMessage(from, {
      image: { url: videoData.url },
      caption: caption
    }, { quoted: m });

    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    const messageID = sentMsg.key.id;

    conn.ev.on("messages.upsert", async (msgData) => {
      const receivedMsg = msgData.messages[0];
      if (!receivedMsg.message) return;

      const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
      const senderID = receivedMsg.key.remoteJid;
      const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

      if (isReplyToBot) {
        await conn.sendMessage(senderID, { react: { text: '⏳', key: receivedMsg.key } });

        try {
          switch (receivedText) {
            case "1":
              await conn.sendMessage(senderID, {
                video: { url: videoData.url },
                caption: "🎥 *Here is your video!*\n\n💜 *Powered By JawadTechX*"
              }, { quoted: receivedMsg });
              break;

            case "2":
              await conn.sendMessage(senderID, {
                audio: { url: videoData.url },
                mimetype: "audio/mpeg"
              }, { quoted: receivedMsg });
              break;

            case "3":
              await conn.sendMessage(senderID, {
                audio: { url: videoData.url },
                mimetype: "audio/ogg",
                ptt: true
              }, { quoted: receivedMsg });
              break;

            case "4":
              await conn.sendMessage(senderID, {
                document: { url: videoData.url },
                mimetype: "video/mp4",
                fileName: `${videoData.title}.mp4`,
                caption: "📄 *Here is your document!*\n\n💜 *Powered By JawadTechX*"
              }, { quoted: receivedMsg });
              break;

            default:
              reply("❌ *Invalid option! Please reply with 1, 2, 3, or 4.*");
              return;
          }
          await conn.sendMessage(senderID, { react: { text: '✅', key: receivedMsg.key } });
        } catch (error) {
          console.log(error);
          await conn.sendMessage(senderID, { react: { text: '❌', key: receivedMsg.key } });
          reply("❌ *An error occurred while processing your request.*");
        }
      }
    });

  } catch (error) {
    console.log(error);
    await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    reply("❌ *An error occurred while processing your request.*");
  }
});
