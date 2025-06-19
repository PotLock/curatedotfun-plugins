---
sidebar_position: 9
---

# 🟣 Farcaster Plugin

The Farcaster plugin enables distribution of curated content to [Farcaster](https://farcaster.xyz) using the Neynar API.

## 🔧 Setup Guide

1. **Get Neynar API Credentials**
   - Sign up at [Neynar](https://neynar.com) and obtain your API key.
   - Create a signer in the Neynar dashboard and copy the `signerUuid`.

2. **Add the Plugin to Your Configuration**

   In your `curate.config.json` or via the Plugin Manager UI, add the Farcaster plugin:

   ```json
   {
     "outputs": {
       "stream": {
         "enabled": true,
         "distribute": [
           {
             "plugin": "@curatedotfun/farcaster",
             "config": {
               "apiKey": "{FARCASTER_API_KEY}",
               "signerUuid": "{FARCASTER_SIGNER_UUID}"
             }
           }
         ]
       }
     }
   }
   ```

   > **Tip:** Use environment variable placeholders (e.g., `{FARCASTER_API_KEY}`) and set them in your `.env` file for security.

## ⚙️ Configuration

| Parameter   | Type   | Required | Description                                 |
|------------|--------|----------|---------------------------------------------|
| apiKey     | string | Yes      | Your Neynar API key                         |
| signerUuid | string | Yes      | The UUID of your Neynar signer              |

- Get your API key and signer UUID from the [Neynar dashboard](https://neynar.com).

## 🚀 Usage

Once configured, the plugin will post content to Farcaster using the Neynar API whenever a distribution action is triggered.

No additional setup is required after configuration. The plugin will use the provided credentials to publish casts.

## 🛡️ Security Notes

- **Never commit your API key or signer UUID to version control.**
- Store sensitive credentials in environment variables or a secure configuration management system.

## 📝 Example

```typescript
import { FarcasterPlugin } from '@curatedotfun/farcaster';

const plugin = new FarcasterPlugin();
await plugin.initialize({
  apiKey: process.env.FARCASTER_API_KEY!,
  signerUuid: process.env.FARCASTER_SIGNER_UUID!
});
await plugin.distribute({ input: 'Hello, Farcaster!', config: plugin["config"] });
```

## 🔗 Resources
- [Farcaster](https://farcaster.xyz)
- [Neynar API](https://docs.neynar.com/) 