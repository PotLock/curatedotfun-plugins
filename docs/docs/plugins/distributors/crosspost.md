---
sidebar_position: 8
---

# 🔄 Crosspost Plugin

The Crosspost plugin enables distribution of curated content to [Crosspost](https://crosspost.near), a cross-platform social media posting service built on the NEAR Protocol.

## 🔧 Setup Guide

1. Create a NEAR account if you don't already have one.

   :::note
   You'll need a NEAR account with sufficient funds to cover transaction fees for posting content to Crosspost.
   :::

2. Generate a function call access key (FCAK) for your account using [NEAR CLI](https://github.com/near/near-cli-rs):

   ```bash
   near account add-key YOUR_ACCOUNT_ID grant-function-call-access --allowance '0 NEAR' --contract-account-id crosspost.near --function-names '' autogenerate-new-keypair print-to-terminal network-config mainnet sign-with-keychain send
   ```

   This will print a secret keypair to your terminal. Copy this keypair as it will be used as your `keyPair` in the configuration.

   :::tip
   Before using Crosspost, you should login to [opencrosspost.com](https://opencrosspost.com) with your NEAR wallet and connect your social media accounts.
   :::

3. Modify your `curate.config.json` to include the Crosspost configuration:

   ```json
   {
     "outputs": {
       "stream": {
         "enabled": true,
         "distribute": [
           {
             "plugin": "@curatedotfun/crosspost",
             "config": {
               "signerId": "account.near",
               "keyPair": "{ACCOUNT_PRIVATE_KEY}",
               "method": "create"
             }
           }
         ]
       }
     }
   }
   ```

   The container is already set up to hydrate environment variables into the configuration at runtime, replacing `{ACCOUNT_PRIVATE_KEY}` with the values from the environment.

   You need to specify:
   - `signerId`: Your NEAR account ID (e.g., example.near)
   - `keyPair`: The private key for your NEAR account
   - `method`: The action to perform (see Methods section below)

   :::caution
   Keep your private key secure! Never commit it directly to your configuration files or repositories.
   :::

4. Enable the stream by setting `"enabled": true` if not already enabled.

   Once merged, your approved messages will start flowing to Crosspost through your configured account.

   :::tip
   If your stream had been disabled and you have existing, approved curations, call `/api/feeds/:feedId/process` to process them.
   :::

## 📝 Configuration Reference

Full configuration options for the Crosspost plugin:

```json
{
  "plugin": "@curatedotfun/crosspost",
  "config": {
    "signerId": "account.near",
    "keyPair": "{ACCOUNT_PRIVATE_KEY}", // Automatically injected from environment
    "method": "create" // One of: create, reply, delete, like, unlike, repost, quote
  }
}
```

## 🔄 Methods

The Crosspost plugin supports several methods for interacting with the Crosspost platform. The method you choose determines what action will be performed and what input data is required.

| Method | Description | Required Input Schema |
|--------|-------------|----------------------|
| `create` | Create a new post | `CreatePostRequestSchema` |
| `reply` | Reply to an existing post | `ReplyToPostRequestSchema` |
| `delete` | Delete a post | `DeletePostRequestSchema` |
| `like` | Like a post | `LikePostRequestSchema` |
| `unlike` | Unlike a post | `UnlikePostRequestSchema` |
| `repost` | Repost content | `RepostRequestSchema` |
| `quote` | Quote a post with additional text | `QuotePostRequestSchema` |

Each method requires specific input data that conforms to the corresponding schema from the `@crosspost/types` package. For example, when using the `create` method, your input must conform to the `CreatePostRequestSchema`, which typically includes a `text` field for the post content.

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

## 🔐 Security Considerations

- The Crosspost plugin requires a private key to sign transactions. This key should be a function call access key.
- Consider using a dedicated NEAR account for distribution purposes rather than your main account.
- Monitor your account's activity regularly to ensure it's being used as expected.
- Set appropriate gas limits for your transactions to control costs.

## 🔗 Related Resources

- [Crosspost SDK Documentation](https://github.com/open-crosspost/open-crosspost-proxy-service/tree/main/packages/sdk)
- [Crosspost Types Documentation](https://github.com/open-crosspost/open-crosspost-proxy-service/tree/main/packages/types)
- [NEAR Protocol Documentation](https://docs.near.org/)
- [Open Crosspost](https://opencrosspost.com)
