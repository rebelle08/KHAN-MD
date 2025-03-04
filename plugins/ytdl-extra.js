const { cmd } = require("../command");
const yts = require("yt-search");
const axios = require("axios");

cmd({
  pattern: "yt",
  alias: ["youtube"],
  desc: "Download YouTube videos",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, quoted, args, q, reply }) => {
  try {
    if (!q) {
      return reply("*`Please provide a YouTube link or title!`*");
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    let videoUrl = q;
    let searchData = null;

    // If the user provides a title instead of a link
    if (!q.startsWith("https://")) {
      const searchResults = await yts(q);
      if (!searchResults.videos.length) return reply("*No results found!*");

      searchData = searchResults.videos[0];
      videoUrl = searchData.url;
    }

    // Fetch download link from API
    const { data } = await axios.get(`https://velyn.vercel.app/api/downloader/ytmp4?url=${videoUrl}`);
    if (!data.status) return reply("*Failed to fetch video!*");

    const ytData = searchData || {
      title: data.data.title,
      thumbnail: `https://i.ytimg.com/vi/${videoUrl.split("v=")[1]}/maxresdefault.jpg`,
      timestamp: "Unknown"
    };

    const caption = `╭━━━〔 *YT DOWNLOADER* 〕━━━⊷\n`
      + `┃ 📌 *Title:* ${ytData.title}\n`
      + `┃ ⏳ *Duration:* ${ytData.timestamp}\n`
      + `╰━━━━━━━━━━━━━━━⪼\n\n`
      + `🎬 *Download Options:*\n`
      + `1️⃣  *Video*\n`
      + `2️⃣  *Document*\n`
      + `3️⃣  *Audio*\n\n`
      + `📌 *Please reply with 1, 2, or 3.*`;

    const sentMsg = await conn.sendMessage(from, {
      image: { url: ytData.thumbnail },
      caption: caption
    }, { quoted: m });

    const messageID = sentMsg.key.id;

    conn.ev.on("messages.upsert", async (msgData) => {
      const receivedMsg = msgData.messages[0];
      if (!receivedMsg.message) return;

      const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
      const senderID = receivedMsg.key.remoteJid;
      const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

      if (isReplyToBot) {
        await conn.sendMessage(senderID, { react: { text: '⬇️', key: receivedMsg.key } });

        let downloadLink = data.data.url;

        switch (receivedText) {
          case "1":
            await conn.sendMessage(senderID, {
              video: { url: downloadLink },
              caption: "Powered By JawadTechX 💜"
            }, { quoted: receivedMsg });
            break;

          case "2":
            await conn.sendMessage(senderID, {
              document: { url: downloadLink },
              mimetype: "video/mp4",
              fileName: `${ytData.title}.mp4`,
              caption: "Powered By JawadTechX 💜"
            }, { quoted: receivedMsg });
            break;

          case "3":
            await conn.sendMessage(senderID, {
              audio: { url: downloadLink },
              mimetype: "audio/mpeg"
            }, { quoted: receivedMsg });
            break;

          default:
            reply("❌ Invalid option! Please reply with 1, 2, or 3.");
        }

        await conn.sendMessage(senderID, { react: { text: '✅', key: receivedMsg.key } });
      }
    });

  } catch (error) {
    console.log(error);
    reply("⚠️ *Error fetching video!*");
  }
});
