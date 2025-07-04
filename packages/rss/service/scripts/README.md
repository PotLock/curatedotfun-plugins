To use the script:

1. __Set Environment Variables__: Create a `.env` file in the `packages/rss/service` directory with the following variables:

   ```javascript
   # URL of the old RSS service you are migrating from
   OLD_SERVICE_URL=http://localhost:4001

   # URL of the new multi-feed RSS service
   NEW_SERVICE_URL=http://localhost:4001

   # API secret for both services
   API_SECRET=your-api-secret
   ```

2. __Run the Migration__: Execute the script using Bun:

   ```bash
   bun run packages/rss/service/scripts/migrate.ts
   ```
