# @curatedotfun/farcaster

A Farcaster plugin for curatedotfun that allows posting content to the Farcaster network using the Neynar API.

## Installation

```bash
npm install @curatedotfun/farcaster
```

## Usage

```typescript
import { FarcasterPlugin } from '@curatedotfun/farcaster';

// Initialize the plugin with your Neynar API credentials
const farcasterPlugin = new FarcasterPlugin({
  apiKey: 'your-neynar-api-key', // Get from https://neynar.com
  signerUuid: 'your-signer-uuid' // Get from Neynar dashboard
});

// Initialize the plugin
await farcasterPlugin.initialize();

// Post content to Farcaster
await farcasterPlugin.post('Hello, Farcaster!');

// Cleanup when done
await farcasterPlugin.shutdown();
```

## Configuration

The plugin requires the following configuration:

- `apiKey`: Your Neynar API key (get it from https://neynar.com)
- `signerUuid`: Your signer UUID from Neynar dashboard

## Prerequisites

1. A Neynar API key (get it from https://neynar.com)
2. A signer UUID from your Neynar dashboard

## Security Notes

- Never commit your API key or signer UUID to version control
- Store sensitive credentials in environment variables or a secure configuration management system

## License

MIT 