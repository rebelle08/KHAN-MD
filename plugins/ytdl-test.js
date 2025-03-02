const { cmd } = require('../command');
const { ytdlv1 } = require('@vioo/apis');
const yts = require("yt-search");

cmd({
    pattern: "ytmp4",
    desc: "Download YouTube videos in MP4 format",
    category: "downloader",
    react: "🎥",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply }) => {
    try {
        if (!q) return reply("Please provide a YouTube URL or video title.");
        reply("🔍 Searching...");

        let url = q;
        if (!q.startsWith("http")) {
            let search = await yts(q);
            if (!search.videos.length) return reply("No results found.");
            url = search.videos[0].url; // Get first result's URL
            reply(`🎬 *Title:* ${search.videos[0].title}\n⏳ Downloading...`);
        }

        let video = await ytdlv1(url, "mp4", 1080);
        if (!video || !video.url) return reply("Failed to fetch video.");

        await conn.sendMessage(from, {
            video: { url: video.url },
            caption: `🎬 *Title:* ${video.title}\n📥 *Quality:* 1080p\n🔗 *Link:* ${url}\n\nPowered by JawadTechX`
        }, { quoted: mek });

    } catch (e) {
        console.error("Error in ytmp4 command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});
const { cmd } = require('../command');
const { ytdlv1 } = require('@vioo/apis');
const yts = require("yt-search");

cmd({
    pattern: "ytmp3",
    desc: "Download YouTube audio in MP3 format",
    category: "downloader",
    react: "🎵",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply }) => {
    try {
        if (!q) return reply("Please provide a YouTube URL or song title.");
        reply("🔍 Searching...");

        let url = q;
        let title = "";
        if (!q.startsWith("http")) {
            let search = await yts(q);
            if (!search.videos.length) return reply("No results found.");
            url = search.videos[0].url;
            title = search.videos[0].title;
            reply(`🎶 *Title:* ${title}\n⏳ Downloading...`);
        }

        let audio = await ytdlv1(url, "mp3", 320);
        if (!audio || !audio.url) return reply("Failed to fetch audio.");

        await conn.sendMessage(from, {
            audio: { url: audio.url },
            mimetype: "audio/mpeg",
            fileName: `${audio.title}.mp3`
        }, { quoted: mek });

        // Send song details separately
        await conn.sendMessage(from, {
            text: `🎵 *Title:* ${audio.title}\n🎧 *Quality:* 320kbps\n🔗 *Link:* ${url}\n\nPowered by JawadTechX`
        });

    } catch (e) {
        console.error("Error in ytmp3 command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});
