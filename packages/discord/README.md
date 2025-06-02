# 💬 Discord Plugin

The Discord plugin enables distribution of curated content to Discord channels.

## 🔧 Setup Guide

1. Create a Discord bot and get its token:
   - Go to the [Discord Developer Portal](https://discord.com/developers/applications)
   - Click "New Application" and give it a name
   - Go to the "Bot" section and click "Add Bot"
   - Under the bot's token section, click "Copy" to get your bot token
   - Enable the "Message Content Intent" under Privileged Gateway Intents

2. Get your channel ID:
   - Enable Developer Mode in Discord (User Settings > Advanced > Developer Mode)
   - Right-click on the channel you want to post to and select "Copy ID"

3. Modify your `curate.config.json` to include the Discord configuration:

   ```json
   {
     "outputs": {
       "stream": {
         "enabled": true,
         "distribute": [
           {
             "plugin": "@curatedotfun/discord",
             "config": {
               "botToken": "{DISCORD_BOT_TOKEN}",
               "channelId": "123456789012345678"
             }
           }
         ]
       }
     }
   }
   ```

   The container is already set up with the Discord bot token, which handles the API requests from the bot to your Discord channel. It automatically gets hydrated into the curate.config.json on start-up, replacing `{DISCORD_BOT_TOKEN}`.

   You need to specify:
   - `channelId`: Your Discord channel ID (e.g., 123456789012345678)

   These values can be shared publicly.

4. Add the bot to your server:
   - Go to OAuth2 > URL Generator in your bot's settings
   - Select the "bot" scope
   - Select the "Send Messages" and "Read Message History" permissions
   - Use the generated URL to add the bot to your server

5. Enable the stream by setting `"enabled": true` if not already enabled.

   Once merged, your approved messages will start flowing to the configured Discord channel.

   :::tip
   If your stream had been disabled and you have existing, approved curations, call `/api/feeds/:feedId/process` to process them.
   :::

## 📝 Configuration Reference

Full configuration options for the Discord plugin:

```json
{
  "plugin": "@curatedotfun/discord",
  "config": {
    "botToken": "{DISCORD_BOT_TOKEN}", // Automatically injected
    "channelId": "123456789012345678" // Your Discord channel ID
  }
}
``` 