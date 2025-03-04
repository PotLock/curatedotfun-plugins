---
sidebar_position: 6
---

# 📰 RSS Plugin

The RSS plugin enables distribution of curated content to RSS feeds, allowing you to publish content to your own RSS feed that can be consumed by RSS readers and other applications.

## 🚀 Features

- **RSS Feed Generation**: Create and manage RSS feeds programmatically
- **Flexible Deployment**: Deploy the RSS service to various platforms (Vercel, Netlify, Heroku, Cloudflare)
- **Secure Authentication**: JWT-based authentication for feed management
- **Fallback Mechanism**: Local file storage as a fallback if the service is unavailable
- **Customizable Feed Properties**: Configure feed title, item limit, and more

## 🔧 Setup Guide

1. Deploy the RSS service to your preferred hosting platform (see the [RSS Service README](../../apps/rss-service/README.md) for deployment options).

2. Generate a JWT token for authentication. You can use a tool like [jwt.io](https://jwt.io/) to generate a token with your JWT secret.

   :::note
   The JWT token is used to authenticate requests to the RSS service. Make sure to keep your JWT secret secure.
   :::

3. Modify your `curate.config.json` to include the RSS configuration:

   ```json
   {
     "outputs": {
       "stream": {
         "enabled": true,
         "distribute": [
           {
             "plugin": "@curatedotfun/rss",
             "config": {
               "feedId": "my-feed",
               "title": "My RSS Feed",
               "maxItems": "100",
               "serviceUrl": "https://your-rss-service-url.com",
               "jwtToken": "{JWT_TOKEN}"
             }
           }
         ]
       }
     }
   }
   ```

   The container is already set up to hydrate environment variables into the configuration at runtime, replacing `{JWT_TOKEN}` with the values from the environment.

   You need to specify:
   - `feedId`: A unique identifier for your feed
   - `title`: The title of your RSS feed
   - `maxItems`: (Optional) Maximum number of items to keep in the feed (default: 100)
   - `serviceUrl`: The URL of your deployed RSS service
   - `jwtToken`: JWT token for authentication with the RSS service

   :::caution
   Keep your JWT token secure! Never commit it directly to your configuration files or repositories.
   :::

4. Enable the stream by setting `"enabled": true` if not already enabled.

   Once merged, your approved messages will start flowing to your RSS feed through the configured service.

   :::tip
   If your stream had been disabled and you have existing, approved curations, call `/api/feeds/:feedId/process` to process them.
   :::

## 📝 Configuration Reference

Full configuration options for the RSS plugin:

```json
{
  "plugin": "@curatedotfun/rss",
  "config": {
    "feedId": "my-feed",
    "title": "My RSS Feed",
    "maxItems": "100", // Optional: Maximum number of items to keep in the feed, defaults to 100
    "serviceUrl": "https://your-rss-service-url.com", // URL of your deployed RSS service
    "jwtToken": "{JWT_TOKEN}", // Automatically injected from environment
    "path": "/path/to/rss.xml" // Optional: Local file path to write the RSS feed to (for backward compatibility)
  }
}
```

## 🔄 Data Transformation

The RSS plugin accepts a string input that becomes the content of the RSS item. When used directly, it will create an RSS item with the input string as the content. However, you'll typically want to transform your data before sending it to the RSS plugin.

### Input Data Structure

The plugin is designed to work with the curatedotfun pipeline, which typically passes submission objects like:

```typescript
export interface TwitterSubmission {
  tweetId: string;
  userId: string;
  username: string;
  curatorId: string;
  curatorUsername: string;
  content: string;
  curatorNotes: string | null;
  curatorTweetId: string;
  createdAt: string;
  submittedAt: string | null;
  moderationHistory: Moderation[];
  status?: SubmissionStatus;
}

export interface TwitterSubmissionWithFeedData extends TwitterSubmission {
  status: SubmissionStatus;
  moderationResponseTweetId?: string;
}
```

### Using Transformer Plugins

To format this data properly for RSS, you can use transformer plugins like `@curatedotfun/simple-transform` or `@curatedotfun/object-transform` before the RSS plugin.

#### Example with Simple Transform

```json
{
  "outputs": {
    "stream": {
      "enabled": true,
      "distribute": [
        {
          "plugin": "@curatedotfun/simple-transform",
          "config": {
            "template": "<h2>Tweet by {{username}}</h2><p>{{content}}</p>{{#curatorNotes}}<blockquote>Curator's Note: {{.}}</blockquote>{{/curatorNotes}}<p><a href=\"https://twitter.com/{{username}}/status/{{tweetId}}\">View original tweet</a></p>"
          }
        },
        {
          "plugin": "@curatedotfun/rss",
          "config": {
            "feedId": "twitter-feed",
            "title": "Curated Twitter Feed",
            "serviceUrl": "https://your-rss-service-url.com",
            "jwtToken": "{JWT_TOKEN}"
          }
        }
      ]
    }
  }
}
```

This transforms the Twitter submission into HTML content for the RSS feed.

#### Example with Object Transform

For more complex transformations, use the Object Transform plugin to create a structured RSS item:

```json
{
  "outputs": {
    "stream": {
      "enabled": true,
      "distribute": [
        {
          "plugin": "@curatedotfun/object-transform",
          "config": {
            "mappings": {
              "title": "Tweet by {{username}}",
              "content": "<p>{{content}}</p>{{#curatorNotes}}<blockquote>Curator's Note: {{.}}</blockquote>{{/curatorNotes}}",
              "link": "https://twitter.com/{{username}}/status/{{tweetId}}",
              "publishedAt": "{{createdAt}}",
              "guid": "tweet-{{tweetId}}"
            }
          }
        },
        {
          "plugin": "@curatedotfun/rss",
          "config": {
            "feedId": "twitter-feed",
            "title": "Curated Twitter Feed",
            "serviceUrl": "https://your-rss-service-url.com",
            "jwtToken": "{JWT_TOKEN}"
          }
        }
      ]
    }
  }
}
```

This creates a fully structured RSS item with title, content, link, publication date, and a unique identifier.

## 💡 Advanced Examples

### Multi-Source Feed

Combine content from multiple sources into a single RSS feed:

```json
{
  "outputs": {
    "stream": {
      "enabled": true,
      "distribute": [
        {
          "plugin": "@curatedotfun/object-transform",
          "config": {
            "mappings": {
              "title": "{{#source}}[{{.}}] {{/source}}{{#username}}@{{.}}: {{/username}}{{#title}}{{.}}{{/title}}{{^title}}{{content|truncate:60}}{{/title}}",
              "content": "<p>{{content}}</p>{{#curatorNotes}}<blockquote>Curator's Note: {{.}}</blockquote>{{/curatorNotes}}",
              "link": "{{url}}",
              "publishedAt": "{{createdAt}}",
              "guid": "{{id}}"
            }
          }
        },
        {
          "plugin": "@curatedotfun/rss",
          "config": {
            "feedId": "curated-content",
            "title": "Curated Content Feed",
            "serviceUrl": "https://your-rss-service-url.com",
            "jwtToken": "{JWT_TOKEN}"
          }
        }
      ]
    }
  }
}
```

This example:
- Formats titles differently based on the content source
- Uses truncation for titles when none is provided
- Creates a unified feed from multiple content types

### Rich Content Feed

Create a rich RSS feed with formatted content:

```json
{
  "outputs": {
    "stream": {
      "enabled": true,
      "distribute": [
        {
          "plugin": "@curatedotfun/object-transform",
          "config": {
            "mappings": {
              "title": "{{username}}'s Tweet",
              "content": "<div style='border: 1px solid #ddd; padding: 15px; border-radius: 8px;'><h3>{{username}} (@{{username}})</h3><p style='font-size: 16px;'>{{content}}</p>{{#media.length}}<div><img src='{{media.0.url}}' alt='Tweet media' style='max-width: 100%; border-radius: 8px;'></div>{{/media.length}}<div style='color: #666; margin-top: 10px;'>{{metrics.likes}} Likes · {{metrics.retweets}} Retweets</div>{{#curatorNotes}}<div style='margin-top: 15px; padding: 10px; background: #f5f5f5; border-radius: 8px;'><strong>Curator's Note:</strong> {{.}}</div>{{/curatorNotes}}<div style='margin-top: 15px;'><a href='https://twitter.com/{{username}}/status/{{tweetId}}' style='color: #1DA1F2; text-decoration: none;'>View on Twitter</a></div></div>",
              "link": "https://twitter.com/{{username}}/status/{{tweetId}}",
              "publishedAt": "{{createdAt}}",
              "guid": "tweet-{{tweetId}}"
            }
          }
        },
        {
          "plugin": "@curatedotfun/rss",
          "config": {
            "feedId": "styled-twitter-feed",
            "title": "Styled Twitter Feed",
            "serviceUrl": "https://your-rss-service-url.com",
            "jwtToken": "{JWT_TOKEN}"
          }
        }
      ]
    }
  }
}
```

This example creates a visually rich RSS feed with styled HTML content.

## 🔐 Security Considerations

- The RSS plugin requires a JWT token to authenticate with the RSS service. This token should be stored securely as an environment variable.
- Consider restricting access to your RSS service by configuring the ALLOWED_ORIGINS environment variable.
- Monitor your RSS service's activity regularly to ensure it's being used as expected.

## 📡 Accessing Your RSS Feed

Once your RSS service is deployed and the plugin is configured, your RSS feed will be available at:

```
https://your-rss-service-url.com/feeds/my-feed
```

Where `my-feed` is the `feedId` you specified in your configuration.

You can share this URL with users who want to subscribe to your feed using their favorite RSS reader.
