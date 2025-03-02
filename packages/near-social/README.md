# NEAR Social Plugin for Curated.fun

A distribution plugin for posting content to NEAR Social.

## Installation

```bash
npm install @curatedotfun/near-social
```

## Usage

```typescript
import NearSocialPlugin from "@curatedotfun/near-social";

// Create an instance of the plugin
const nearSocialPlugin = new NearSocialPlugin();

// Initialize the plugin with your NEAR account credentials
await nearSocialPlugin.initialize({
  accountId: "your-account.near",
  privateKey: "your-private-key",
  networkId: "mainnet" // or "testnet"
});

// Distribute content to NEAR Social
await nearSocialPlugin.distribute({
  input: "Hello, NEAR Social! This is a post from Curated.fun."
});
```

## Configuration

The plugin requires the following configuration:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | Your NEAR account ID (e.g., "example.near") |
| privateKey | string | Yes | Your NEAR account private key |
| networkId | "mainnet" \| "testnet" | No | The NEAR network to use (defaults to "mainnet") |

## Security Considerations

- **NEVER** hardcode your private key in your application code.
- Use environment variables or a secure secret management system to store sensitive credentials.
- Consider using a dedicated NEAR account for posting to NEAR Social rather than your main account.

## Features

- Post text content to NEAR Social
- Automatically formats and indexes posts for proper display on NEAR Social
- Supports both mainnet and testnet

## Development

```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Run tests
npm test
```

## License

MIT
