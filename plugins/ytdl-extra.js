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
    if (!q || (!q.startsWith("https://") && args.length < 1)) {
      return conn.sendMessage(from, { text: "*`Provide a YouTube URL or search query.`*" }, { quoted: m });
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    let videoURL, betterThumbnail, videoTitle;

    if (q.startsWith("https://")) {
      videoURL = q;
    } else {
      const search = await yts(q);
      const firstResult = search.videos[0];

      if (!firstResult) return reply("*`No results found.`*");

      videoURL = firstResult.url;
      betterThumbnail = firstResult.thumbnail;
      videoTitle = firstResult.title;
    }

    const apiUrl = `https://velyn.vercel.app/api/downloader/ytmp4?url=${videoURL}`;

    const videoResponse = await axios.get(apiUrl);
    const videoData = videoResponse.data.data;
    
    const finalThumbnail = betterThumbnail || videoData.thumbnail;
    const title = videoTitle || videoData.title;
    
    const caption = `╭━━━━〔 *YT DOWNLOADER* 〕━━━⊷\n`
      + `┃ 🎬 *Title:* ${title}\n`
      + `╰━━━━━━━━━━━━━━━━━━━⪼\n\n`
      + `📌 *Choose Your Download Option:*\n`
      + `1️⃣  *Video* 📹\n`
      + `2️⃣  *Document* 📁\n`
      + `3️⃣  *Audio* 🎵\n\n`
      + `> *© Powered By JawadTechX 💜.*`;

    const sentMsg = await conn.sendMessage(from, {
      image: { url: finalThumbnail },
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

        switch (receivedText) {
          case "1":
            await conn.sendMessage(senderID, {
              video: { url: videoData.url },
              caption: "🎬 *Powered By JawadTechX 💜*"
            }, { quoted: receivedMsg });
            break;

          case "2":
            await conn.sendMessage(senderID, {
              document: { url: videoData.url },
              mimetype: "video/mp4",
              fileName: "YouTube_Video.mp4",
              caption: "📁 *Powered By JawadTechX 💜*"
            }, { quoted: receivedMsg });
            break;

          case "3":
            await conn.sendMessage(senderID, {
              audio: { url: videoData.url },
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
    reply("❌ *Error fetching video. Try again later!*");
  }
});
