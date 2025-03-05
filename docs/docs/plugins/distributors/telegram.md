---
sidebar_position: 1
---

# 📱 Telegram Plugin

The Telegram plugin enables distribution of curated content to Telegram channels.

## 🔧 Setup Guide

1. Create a channel via the top right icon in Telegram and get the public channel ID (e.g., @test_curation). This is the channel where the bot will publish content.

   :::note
   If you want the bot to post to an existing channel's topic, you'll need to determine the message_thread_id. You can find this by following [these instructions](https://gist.github.com/nafiesl/4ad622f344cd1dc3bb1ecbe468ff9f8a#get-chat-id-for-a-topic-in-a-group-chat).
   :::

2. Modify your `curate.config.json` to include the channel configuration:

   ```json
   {
     "outputs": {
       "stream": {
         "enabled": true,
         "distribute": [
           {
             "plugin": "@curatedotfun/telegram",
             "config": {
               "botToken": "{TELEGRAM_BOT_TOKEN}",
               "channelId": "@your_channel_id"
             }
           }
         ]
       }
     }
   }
   ```

   The container is already set up with the telegram bot token for [@curate_dot_fun_bot](https://t.me/curate_dot_fun_bot), which handles the HTTP API requests from the bot to your Telegram channel. It automatically gets hydrated into the curate.config.json on start-up, replacing `{TELEGRAM_BOT_TOKEN}`.

   You need to specify:
   - `channelId`: Your public channel ID (e.g., @test_curation)
   - `messageThreadId`: (Optional) The topic ID if posting to a specific topic within the channel

   These values can be shared publicly.

3. Add [@curatedotfun_bot](https://t.me/curatedotfun_bot) as an admin to your channel or topic.

4. Enable the stream by setting `"enabled": true` if not already enabled.

   Once merged, your approved messages will start flowing to the configured Telegram channel.

   :::tip
   If your stream had been disabled and you have existing, approved curations, call `/api/feeds/:feedId/process` to process them.
   :::

## 📝 Configuration Reference

Full configuration options for the Telegram plugin:

```json
{
  "plugin": "@curatedotfun/telegram",
  "config": {
    "botToken": "{TELEGRAM_BOT_TOKEN}", // Automatically injected
    "channelId": "@channel_id", // Your public channel ID
    "messageThreadId": "123" // Optional: Topic ID for posting to a specific topic
  }
}
