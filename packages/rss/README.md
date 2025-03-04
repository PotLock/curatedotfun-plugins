---
sidebar_position: 6
---

# 📰 RSS Plugin

The RSS plugin enables distribution of curated content to RSS feeds, allowing you to publish content to your own RSS feed that can be consumed by RSS readers and other applications.

## 🚀 Features

- **Multiple Feed Formats**: Generate RSS 2.0, Atom, and JSON Feed formats
- **Standard-Compliant URLs**: Access feeds via standard paths (`/rss.xml`, `/atom.xml`, `/feed.json`) or api route `/api/items`
- **Flexible Deployment**: Deploy the RSS service to various platforms (Vercel, Netlify, Heroku, Cloudflare)
- **Secure Authentication**: Simple API secret authentication for feed management

## 🔧 Setup Guide

1. Deploy the RSS service to your preferred hosting platform (see the [RSS Service README](../../apps/rss-service/README.md) for deployment options).

2. Generate a secure random string to use as your API secret. This will be shared between your application and the RSS service.

   :::note
   The API secret is used to authenticate requests to the RSS service. Make sure to keep it secure.
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
               "serviceUrl": "https://your-rss-service-url.com",
               "apiSecret": "{API_SECRET}"
             }
           }
         ]
       }
     }
   }
   ```

   The container is already set up to hydrate environment variables into the configuration at runtime, replacing `{API_SECRET}` with the values from the environment.

   You need to specify:
   - `serviceUrl`: The URL of your deployed RSS service
   - `apiSecret`: API secret for authentication with the RSS service

   :::caution
   Keep your API secret secure! Never commit it directly to your configuration files or repositories.
   :::

4. Enable the stream by setting `"enabled": true` if not already enabled.

   Once merged, your approved messages will start flowing to your RSS feed through the configured service.

## 📝 Configuration Reference

Full configuration options for the RSS plugin:

```json
{
  "plugin": "@curatedotfun/rss",
  "config": {
    "serviceUrl": "https://your-rss-service-url.com", // URL of your deployed RSS service
    "apiSecret": "{API_SECRET}" // Automatically injected from environment
  }
}
```

## 🔄 Data Transformation

The RSS plugin accepts structured input data that maps to RSS item fields. You can provide as much or as little data as you want, and the plugin will fill in defaults for missing fields.

### Input Data Structure

The plugin validates input using Zod and expects an object with these fields (content and link are required, others are optional):

```typescript
interface RssInput {
  title?: string;
  content: string; // Required
  link: string;    // Required
  publishedAt?: string; // Default: new Date().toISOString()
  guid?: string;        // Default: `item-${Date.now()}`
  author?: string;
  categories?: string[];
  comments?: string;
  enclosure?: {
    url: string;
    length: number;
    type: string;
  };
  source?: {
    url: string;
    title: string;
  };
  isPermaLink?: boolean;
}
```

### Using Transformer Plugins

To format your data properly for RSS, you can use transformer plugins like `@curatedotfun/simple-transform` or `@curatedotfun/object-transform` before the RSS plugin.

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
            "serviceUrl": "https://your-rss-service-url.com",
            "apiSecret": "{API_SECRET}"
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
            "serviceUrl": "https://your-rss-service-url.com",
            "apiSecret": "{API_SECRET}"
          }
        }
      ]
    }
  }
}
```

This creates a fully structured RSS item with title, content, link, publication date, and a unique identifier.

## 🔐 Security Considerations

- The RSS plugin requires an API secret to authenticate with the RSS service. This secret should be stored securely as an environment variable.
- Consider restricting access to your RSS service by configuring the ALLOWED_ORIGINS environment variable.
- Monitor your RSS service's activity regularly to ensure it's being used as expected.

## 📡 Accessing Your RSS Feed

Once your RSS service is deployed and the plugin is configured, your RSS feed will be available in multiple formats:

```txt
https://your-rss-service-url.com/rss.xml   # RSS 2.0 format
https://your-rss-service-url.com/atom.xml  # Atom format
https://your-rss-service-url.com/feed.json # JSON Feed format
```

You can share these URLs with users who want to subscribe to your feed using their favorite RSS reader.
