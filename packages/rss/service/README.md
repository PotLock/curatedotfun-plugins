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

```txt
Authorization: Bearer <your-api-secret>
```

Public endpoints (health check and feed retrieval) do not require authentication.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | Yes (for production) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | Yes (for production) |
| `API_SECRET` | Secret key for API authentication | Yes |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed origins for CORS (default: '*') | No |
| `PORT` | Port to run the server on (default: 4001) | No |
| `USE_REDIS_MOCK` | Set to 'true' to use Redis mock for local development | No |

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

### Docker

The easiest way to run the RSS service locally is using Docker with the provided Dockerfile and docker-compose.yml:

1. Make sure you have Docker and Docker Compose installed on your system
2. Navigate to the service directory
3. Run the service with Docker Compose:

   ```cmd
   docker-compose up
   ```

4. The RSS service will be available at http://localhost:4001

This setup includes:

- A Redis container for data storage
- The RSS service container configured to use the Redis container
- Persistent volume for Redis data

### Local Development (Without Docker)

For local development without Docker, you can use the Redis mock:

1. Navigate to the service directory
2. Install dependencies:

   ```cmd
   npm install
   ```

3. Create a `.env` file with the following content:

   ```cmd
   API_SECRET=your-secure-random-string
   USE_REDIS_MOCK=true
   PORT=4001
   ```

4. Start the development server:

   ```cmd
   npm run dev
   ```

5. The RSS service will be available at <http://localhost:4001>

### Production with Upstash Redis

For production deployments, this service uses Upstash Redis for storing and retrieving RSS feed items. Follow these steps to set up Upstash Redis:

1. Create an account at [Upstash](https://upstash.com/) if you don't have one
2. Create a new Redis database:
   - Go to the Upstash Console
   - Click "Create Database"
   - Choose a name for your database
   - Select the region closest to your deployment
   - Choose the appropriate plan (Free tier works for most use cases)
   - Click "Create"
3. Get your REST API credentials:
   - In your database dashboard, click on the "REST API" tab
   - Copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
   - You'll need these values for your environment variables

## Cloud Deployment Options

### Vercel (Recommended with Upstash)

Vercel and Upstash have a seamless integration, making this the recommended deployment option:

1. Create a new project in Vercel
2. Link your repository
3. Configure the build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. Add the required environment variables:
   - `UPSTASH_REDIS_REST_URL`: Your Upstash Redis REST URL
   - `UPSTASH_REDIS_REST_TOKEN`: Your Upstash Redis REST token
   - `API_SECRET`: A secure random string for API authentication
5. Optional: Use the Vercel Upstash Integration
   - In your Vercel project, go to "Integrations"
   - Find and add the Upstash integration
   - This will automatically set up the Redis connection
6. Deploy your project

### Netlify

1. Create a new site in Netlify
2. Link your repository
3. Configure the build settings:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
4. Add the required environment variables in the Netlify dashboard:
   - `UPSTASH_REDIS_REST_URL`: Your Upstash Redis REST URL
   - `UPSTASH_REDIS_REST_TOKEN`: Your Upstash Redis REST token
   - `API_SECRET`: A secure random string for API authentication
5. Deploy your project

### Cloudflare Workers

Cloudflare Workers can be used with Upstash Redis's REST API:

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

### Self-hosted

You can also deploy the RSS service on your own server:

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the required environment variables:
   ```
   UPSTASH_REDIS_REST_URL=your-upstash-redis-rest-url
   UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-rest-token
   API_SECRET=your-api-secret
   PORT=4001 # Optional, defaults to 4001
   ALLOWED_ORIGINS=https://example.com,https://app.example.com # Optional
   ```
4. Build the project:
   ```
   npm run build
   ```
5. Start the server:
   ```
   npm start
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
