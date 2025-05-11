# Crosspost Plugin for curate.fun

A distribution plugin for posting content to Crosspost, a cross-platform social media posting service.

## Installation

```bash
npm install @curatedotfun/crosspost
```

## Usage

```typescript
import CrosspostPlugin from "@curatedotfun/crosspost";

// Create an instance of the plugin
const crosspostPlugin = new CrosspostPlugin();

// Initialize the plugin with your NEAR account credentials and method
await crosspostPlugin.initialize({
  signerId: "your-account.near",
  keyPair: "your-private-key",
  method: "create" // One of: create, reply, delete, like, unlike, repost, quote
});

// Distribute content to Crosspost
await crosspostPlugin.distribute({
  input: {
    targets: [
      {
        platform: "twitter",
        userId: "your-twitter-user-id"
      }
    ],
    content: [
      {
        text: "Hello, world! This is a post from curate.fun."
      }
    ]
  }
});
```

## Configuration

The plugin requires the following configuration:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| signerId | string | Yes | Your NEAR account ID (e.g., "example.near") |
| keyPair | string | Yes | Your NEAR account function call access key (FCAK) |
| method | string | Yes | The method to use (create, reply, delete, like, unlike, repost, quote) |

### Generating a Function Call Access Key

To generate a function call access key (FCAK) for your account, use the [NEAR CLI](https://github.com/near/near-cli-rs):

```bash
near account add-key YOUR_ACCOUNT_ID grant-function-call-access --allowance '0 NEAR' --contract-account-id crosspost.near --function-names '' autogenerate-new-keypair print-to-terminal network-config mainnet sign-with-keychain send
```

This will print a secret keypair to your terminal. Copy this keypair as it will be used as your `keyPair` in the configuration.

Before using Crosspost, you should login to [opencrosspost.com](https://opencrosspost.com) with your NEAR wallet and connect your social media accounts.

Additional parameters may be required depending on the method selected. These are passed through the `input` parameter of the `distribute` method.

## Methods

The plugin supports the following methods:

| Method | Description | Required Input Schema |
|--------|-------------|----------------------|
| create | Create a new post | `CreatePostRequestSchema` |
| reply | Reply to an existing post | `ReplyToPostRequestSchema` |
| delete | Delete a post | `DeletePostRequestSchema` |
| like | Like a post | `LikePostRequestSchema` |
| unlike | Unlike a post | `UnlikePostRequestSchema` |
| repost | Repost content | `RepostRequestSchema` |
| quote | Quote a post with additional text | `QuotePostRequestSchema` |

### Example Input by Method

#### Create Post

```json
{
  "targets": [
    {
      "platform": "twitter",
      "userId": "your-twitter-user-id"
    }
  ],
  "content": [
    {
      "text": "Hello, world! This is a post from Curated.fun."
    }
  ]
}
```

#### Reply to Post

```json
{
  "targets": [
    {
      "platform": "twitter",
      "userId": "your-twitter-user-id"
    }
  ],
  "platform": "twitter",
  "postId": "original-post-id",
  "content": [
    {
      "text": "This is a reply to the original post."
    }
  ]
}
```

#### Delete Post

```json
{
  "targets": [
    {
      "platform": "twitter",
      "userId": "your-twitter-user-id"
    }
  ],
  "posts": [
    {
      "platform": "twitter",
      "userId": "your-twitter-user-id",
      "postId": "post-id-to-delete"
    }
  ]
}
```

#### Like Post

```json
{
  "targets": [
    {
      "platform": "twitter",
      "userId": "your-twitter-user-id"
    }
  ],
  "platform": "twitter",
  "postId": "post-id-to-like"
}
```

#### Unlike Post

```json
{
  "targets": [
    {
      "platform": "twitter",
      "userId": "your-twitter-user-id"
    }
  ],
  "platform": "twitter",
  "postId": "post-id-to-unlike"
}
```

#### Repost

```json
{
  "targets": [
    {
      "platform": "twitter",
      "userId": "your-twitter-user-id"
    }
  ],
  "platform": "twitter",
  "postId": "post-id-to-repost"
}
```

#### Quote Post

```json
{
  "targets": [
    {
      "platform": "twitter",
      "userId": "your-twitter-user-id"
    }
  ],
  "platform": "twitter",
  "postId": "post-id-to-quote",
  "content": [
    {
      "text": "Check out this interesting post!"
    }
  ]
}
```

## Security Considerations

- **NEVER** hardcode your private key in your application code.
- Use environment variables or a secure secret management system to store sensitive credentials.
- Consider using a dedicated NEAR account for posting to Crosspost rather than your main account.

## Features

- Post text content to Crosspost
- Reply to existing posts
- Delete your own posts
- Like and unlike posts
- Repost and quote posts
- Secure authentication using NEAR account credentials

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
