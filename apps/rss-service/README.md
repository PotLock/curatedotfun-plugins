# RSS Service

A lightweight, scalable RSS feed service built with Hono.js and Upstash Redis. This service allows you to create and manage RSS feeds programmatically through a simple REST API.

## Features

- Create and manage RSS feeds
- Add items to feeds
- Retrieve feeds as standard RSS XML
- JWT authentication for secure feed management
- Configurable CORS for cross-origin requests
- Designed for serverless and self-hosted environments

## API Endpoints

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/` | GET | Health check | No |
| `/feeds` | POST | Create a new feed | Yes |
| `/feeds/:id/items` | POST | Add an item to a feed | Yes |
| `/feeds/:id` | GET | Get feed as RSS XML | No |

## Authentication

The RSS service uses JWT for authentication. Protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Public endpoints (health check and RSS feed retrieval) do not require authentication.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | Yes |
| `JWT_SECRET` | Secret key for JWT authentication | Yes |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed origins for CORS (default: '*') | No |
| `PORT` | Port to run the server on (default: 3001) | No |

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
   heroku config:set JWT_SECRET=your-jwt-secret
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
   wrangler secret put JWT_SECRET
   ```
4. Deploy to Cloudflare Workers:
   ```
   wrangler publish
   ```

## Integration with RSS Plugin

The RSS service is designed to work seamlessly with the `@curatedotfun/rss` plugin. To connect the plugin to the service:

1. Initialize the plugin with the service URL and JWT token:

```typescript
import RssPlugin from '@curatedotfun/rss';

const rssPlugin = new RssPlugin();
await rssPlugin.initialize({
  feedId: 'my-feed',
  title: 'My RSS Feed',
  maxItems: '100',
  serviceUrl: 'https://your-rss-service-url.com',
  jwtToken: 'your-jwt-token'
});
```

2. Distribute content through the plugin:

```typescript
await rssPlugin.distribute({
  input: 'New content to add to the feed',
  config: {
    feedId: 'my-feed',
    title: 'My RSS Feed'
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
