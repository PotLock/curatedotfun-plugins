# RSS Service

A lightweight, scalable RSS feed service built with Hono.js and Upstash Redis. This service allows you to create and manage RSS feeds programmatically through a simple REST API.

## Features

- **Multiple Feed Formats**: Generate RSS 2.0, Atom, and JSON Feed formats
- **Standard-Compliant URLs**: Access feeds via standard paths (/rss.xml, /atom.xml, /feed.json)
- **Raw Data Option**: Get content without HTML via /raw.json for frontend customization
- **HTML Sanitization**: Secure content handling with sanitize-html
- **Simple Authentication**: API secret-based authentication for feed management
- **Configurable CORS**: Cross-origin request support
- **Flexible Deployment**: Deploy to various platforms (Vercel, Netlify, Heroku, Cloudflare)

## API Endpoints

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/` | GET | Health check and redirect to preferred format | No |
| `/rss.xml` | GET | Get feed as RSS 2.0 XML | No |
| `/atom.xml` | GET | Get feed as Atom XML | No |
| `/feed.json` | GET | Get feed as JSON Feed (with HTML content) | No |
| `/raw.json` | GET | Get feed as JSON Feed (without HTML content) | No |
| `/api/items` | GET | Get all items as JSON | No |
| `/api/items` | POST | Add an item to the feed | Yes |

## Authentication

The RSS service uses a simple API secret for authentication. Protected endpoints require the API secret in the Authorization header:

```
Authorization: Bearer <your-api-secret>
```

Public endpoints (health check and feed retrieval) do not require authentication.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | Yes |
| `API_SECRET` | Secret key for API authentication | Yes |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed origins for CORS (default: '*') | No |
| `PORT` | Port to run the server on (default: 3001) | No |

## Configuration

The RSS service can be configured using a `feed-config.json` file in the project root:

```json
{
  "feed": {
    "title": "My RSS Feed",
    "description": "A feed of curated content",
    "siteUrl": "https://example.com",
    "language": "en",
    "copyright": "© 2025",
    "favicon": "https://example.com/favicon.ico",
    "author": {
      "name": "Feed Author",
      "email": "author@example.com",
      "link": "https://author.example.com"
    },
    "preferredFormat": "rss",
    "maxItems": 100
  },
  "customization": {
    "categories": ["Technology", "News"],
    "image": "https://example.com/logo.png"
  }
}
```

## Deployment Options

### Vercel

1. Clone this repository
2. Create a new project in Vercel
3. Link your repository
4. Set the following settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Add the required environment variables
6. Deploy

### Netlify

1. Clone this repository
2. Create a new site in Netlify
3. Link your repository
4. Set the following settings:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
5. Add the required environment variables
6. Deploy

### Heroku

1. Clone this repository
2. Create a new Heroku app
3. Add the Heroku remote to your repository:
   ```
   heroku git:remote -a your-app-name
   ```
4. Set the required environment variables:
   ```
   heroku config:set UPSTASH_REDIS_REST_URL=your-redis-url
   heroku config:set UPSTASH_REDIS_REST_TOKEN=your-redis-token
   heroku config:set API_SECRET=your-api-secret
   ```
5. Deploy to Heroku:
   ```
   git push heroku main
   ```

### Cloudflare Workers

1. Install Cloudflare Workers CLI:
   ```
   npm install -g wrangler
   ```
2. Create a `wrangler.toml` file in the project root:
   ```toml
   name = "rss-service"
   type = "javascript"
   account_id = "your-account-id"
   workers_dev = true
   compatibility_date = "2023-01-01"

   [build]
   command = "npm run build"
   [build.upload]
   format = "service-worker"

   [vars]
   ALLOWED_ORIGINS = "*"
   ```
3. Add your secrets:
   ```
   wrangler secret put UPSTASH_REDIS_REST_URL
   wrangler secret put UPSTASH_REDIS_REST_TOKEN
   wrangler secret put API_SECRET
   ```
4. Deploy to Cloudflare Workers:
   ```
   wrangler publish
   ```

## Integration with RSS Plugin

The RSS service is designed to work seamlessly with the `@curatedotfun/rss` plugin. To connect the plugin to the service:

1. Initialize the plugin with the service URL and API secret:

```typescript
import RssPlugin from '@curatedotfun/rss';

const rssPlugin = new RssPlugin();
await rssPlugin.initialize({
  serviceUrl: 'https://your-rss-service-url.com',
  apiSecret: 'your-api-secret'
});
```

2. Distribute content through the plugin:

```typescript
await rssPlugin.distribute({
  input: {
    title: "My RSS Item",
    content: "<p>Content with HTML formatting</p>",
    link: "https://example.com/article",
    publishedAt: new Date().toISOString()
  }
});
```

## Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the required environment variables
4. Start the development server:
   ```
   npm run dev
   ```

## License

MIT
