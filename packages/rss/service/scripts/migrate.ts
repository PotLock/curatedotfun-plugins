import "dotenv/config";

// --- Configuration ---
const OLD_SERVICE_URL = process.env.OLD_SERVICE_URL || "http://localhost:4001";
const NEW_SERVICE_URL = process.env.NEW_SERVICE_URL || "http://localhost:4001";
const API_SECRET = process.env.API_SECRET;

// New feed configuration
const NEW_FEED_CONFIG = {
  title: "My Migrated Feed",
  description: "This is a feed migrated from an old service.",
  siteUrl: "https://example.com/migrated-feed",
  language: "en",
  copyright: `© ${new Date().getFullYear()} My Company`,
  maxItems: 100,
  author: {
    name: "Migration Script",
    email: "script@example.com",
  },
};

// --- Helper Functions ---

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(API_SECRET ? { Authorization: `Bearer ${API_SECRET}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Request to ${url} failed with status ${response.status}: ${errorData.error || response.statusText}`,
    );
  }

  return response.json();
}

// --- Migration Logic ---

async function migrate() {
  console.log("Starting RSS migration...");

  if (!API_SECRET) {
    console.error("API_SECRET environment variable is not set. Aborting.");
    return;
  }

  try {
    // 1. Fetch items from the old service
    console.log(`Fetching items from old service at ${OLD_SERVICE_URL}...`);
    const oldItemsResponse = await fetchWithAuth(
      `${OLD_SERVICE_URL}/api/items?format=html`,
    );
    const itemsToMigrate = oldItemsResponse.items || [];
    console.log(`Found ${itemsToMigrate.length} items to migrate.`);

    if (itemsToMigrate.length === 0) {
      console.log("No items to migrate. Exiting.");
      return;
    }

    // 2. Create a new feed in the new service
    console.log(`Creating new feed in new service at ${NEW_SERVICE_URL}...`);
    const createFeedResponse = await fetchWithAuth(
      `${NEW_SERVICE_URL}/api/feeds`,
      {
        method: "POST",
        body: JSON.stringify(NEW_FEED_CONFIG),
      },
    );
    const newFeedId = createFeedResponse.feedId;
    console.log(`Successfully created new feed with ID: ${newFeedId}`);

    // 3. Push each item to the new feed
    console.log(`Migrating items to new feed '${newFeedId}'...`);
    let successCount = 0;
    let failureCount = 0;

    for (const item of itemsToMigrate) {
      try {
        // Remove fields that should be regenerated
        const { id, guid, ...migrationItem } = item;

        await fetchWithAuth(`${NEW_SERVICE_URL}/api/feeds/${newFeedId}/items`, {
          method: "POST",
          body: JSON.stringify(migrationItem),
        });
        console.log(`  - Migrated item: ${item.title}`);
        successCount++;
      } catch (error) {
        console.error(`  - Failed to migrate item: ${item.title}`, error);
        failureCount++;
      }
    }

    console.log("\n--- Migration Complete ---");
    console.log(`Successfully migrated: ${successCount} items`);
    console.log(`Failed to migrate:    ${failureCount} items`);
    console.log("--------------------------");
  } catch (error) {
    console.error("\nAn error occurred during migration:", error);
  }
}

// Run the migration
migrate();
