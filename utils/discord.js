const { Client, EmbedBuilder } = require("discord.js");
const client = new Client({ intents: ["Guilds"] });
const yaml = require("yaml");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../config/config.yml");
const config = yaml.parse(fs.readFileSync(configPath, "utf8"));

client.login(config.discord.bot_token);

const sendLog = (type, data) => {
  const channel = client.channels.cache.get(config.discord.logChannelId);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(config.discord.embedColor)
    .setTimestamp()
    .setThumbnail(config.discord.botIconUrl) // Fixed: Pass URL string directly
    .setFooter({ text: "Hex Share", iconURL: config.discord.botIconUrl });

  switch (type) {
    case "file_uploaded":
      embed
        .setTitle("📤 File Uploaded")
        .setDescription(`File uploaded by ${data.username}`)
        .addFields([
          { name: "File Name", value: data.fileName, inline: true },
          { name: "Size", value: data.fileSize, inline: true },
          { name: "Type", value: data.fileType, inline: true }
        ]);
      break;

    case "file_downloaded":
      embed
        .setTitle("📥 File Downloaded")
        .setDescription(`File downloaded by ${data.username}`)
        .addFields([
          { name: "File Name", value: data.fileName, inline: true },
          { name: "File ID", value: data.fileId, inline: true }
        ]);
      break;

      case "file_deleted":
        embed
            .setTitle("🗑️ File Deleted")
            .setDescription(`File deleted by ${data.username}`)
            .addFields([
                { name: "File Name", value: data.fileName, inline: true },
                { name: "File ID", value: data.fileId.toString(), inline: true }
            ]);
        break;    

    case "file_shared":
      embed
        .setTitle("🔗 File Shared")
        .setDescription(`File shared by ${data.username}`)
        .addFields([
          { name: "File Name", value: data.fileName, inline: true },
          { name: "File ID", value: data.fileId, inline: true }
        ]);
      break;  }

  channel.send({ embeds: [embed] });
};

module.exports = { sendLog };
