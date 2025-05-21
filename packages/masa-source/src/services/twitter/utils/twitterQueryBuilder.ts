/**
 * Twitter Query Builder
 *
 * Utility to build complex Twitter search queries with support for all advanced search parameters.
 * Based on Twitter's advanced search syntax.
 */

export interface TwitterQueryOptions {
  // Words
  allWords?: string; // All of these words
  exactPhrase?: string; // This exact phrase
  anyWords?: string; // Any of these words
  noneWords?: string; // None of these words
  hashtags?: string[]; // These hashtags

  // Accounts
  fromAccounts?: string[]; // From these accounts
  toAccounts?: string[]; // To these accounts
  mentioningAccounts?: string[]; // Mentioning these accounts

  // Filters
  includeReplies?: boolean; // Include replies (Note: Twitter search often includes replies by default)
  onlyReplies?: boolean; // Only show replies
  // includeLinks?: boolean;   // (Twitter search often includes links by default if not filtering for no links)
  onlyLinks?: boolean; // Only show posts with links

  // Engagement
  minReplies?: number; // Minimum replies
  minLikes?: number; // Minimum likes
  minRetweets?: number; // Minimum retweets

  // Dates
  sinceDate?: string | Date; // From date (YYYY-MM-DD)
  untilDate?: string | Date; // To date (YYYY-MM-DD)

  // Tweet IDs
  sinceId?: string; // Only show tweets with IDs higher than this (Masa might not support this directly)

  // Language
  language?: string; // Language code (e.g., 'en' for English)
}

/**
 * Builds a Twitter search query string based on provided options.
 *
 * @param options The search options to include in the query
 * @returns A formatted Twitter search query string
 */
export function buildTwitterQuery(options: TwitterQueryOptions): string {
  const queryParts: string[] = [];

  // Add words
  if (options.allWords) {
    queryParts.push(options.allWords);
  }

  if (options.exactPhrase) {
    queryParts.push(`"${options.exactPhrase}"`);
  }

  if (options.anyWords) {
    queryParts.push(`(${options.anyWords.split(" ").join(" OR ")})`);
  }

  if (options.noneWords) {
    options.noneWords.split(" ").forEach((word) => {
      queryParts.push(`-${word}`);
    });
  }

  if (options.hashtags && options.hashtags.length > 0) {
    options.hashtags.forEach((tag) => {
      const formattedTag = tag.startsWith("#") ? tag : `#${tag}`;
      queryParts.push(formattedTag);
    });
  }

  // Add accounts
  if (options.fromAccounts && options.fromAccounts.length > 0) {
    options.fromAccounts.forEach((account) => {
      const formattedAccount = account.startsWith("@")
        ? account
        : `@${account}`;
      queryParts.push(`from:${formattedAccount.substring(1)}`);
    });
  }

  if (options.toAccounts && options.toAccounts.length > 0) {
    options.toAccounts.forEach((account) => {
      const formattedAccount = account.startsWith("@")
        ? account
        : `@${account}`;
      queryParts.push(`to:${formattedAccount.substring(1)}`);
    });
  }

  if (options.mentioningAccounts && options.mentioningAccounts.length > 0) {
    options.mentioningAccounts.forEach((account) => {
      const formattedAccount = account.startsWith("@")
        ? account
        : `@${account}`;
      queryParts.push(formattedAccount); // For mentions, just the @account is often enough or can be part of allWords
    });
  }

  // Add filters
  if (options.onlyReplies) {
    queryParts.push("filter:replies"); // This is a standard Twitter search operator
  } else if (options.includeReplies === false) {
    queryParts.push("-filter:replies"); // Exclude replies
  }

  if (options.onlyLinks) {
    queryParts.push("filter:links"); // This is a standard Twitter search operator
  }
  // if (options.includeLinks === false) { // This would be -filter:links, less common to explicitly ask for no links
  //   queryParts.push('-filter:links');
  // }

  // Add engagement metrics
  if (options.minReplies !== undefined && options.minReplies > 0) {
    queryParts.push(`min_replies:${options.minReplies}`);
  }

  if (options.minLikes !== undefined && options.minLikes > 0) {
    queryParts.push(`min_faves:${options.minLikes}`); // Twitter uses min_faves for likes
  }

  if (options.minRetweets !== undefined && options.minRetweets > 0) {
    queryParts.push(`min_retweets:${options.minRetweets}`);
  }

  // Add date range
  if (options.sinceDate) {
    const sinceDateStr = formatDate(options.sinceDate);
    queryParts.push(`since:${sinceDateStr}`);
  }

  if (options.untilDate) {
    const untilDateStr = formatDate(options.untilDate);
    queryParts.push(`until:${untilDateStr}`);
  }

  // Add sinceId (Note: This is a Twitter API parameter, not a search operator. Masa might not use it in query string)
  // If options.sinceId is present, it's usually handled at the API call level, not in the q parameter.
  // For Masa, we'd need to see if their API supports a since_id type parameter for the job.
  // For now, we'll assume it's not part of the text query for Masa.

  // Add language
  if (options.language) {
    queryParts.push(`lang:${options.language}`);
  }

  return queryParts.filter((part) => part.length > 0).join(" ");
}

/**
 * Formats a date as YYYY-MM-DD for Twitter search queries.
 *
 * @param date Date to format (string or Date object)
 * @returns Formatted date string
 */
function formatDate(date: string | Date): string {
  if (typeof date === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    date = new Date(date);
  }

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Creates a simple query for searching mentions of a specific account.
 *
 * @param accountName The account name to search for mentions of (with or without @)
 * @param options Additional query options
 * @returns A formatted Twitter search query string
 */
export function createMentionQuery(
  accountName: string,
  options: Partial<TwitterQueryOptions> = {},
): string {
  const formattedAccount = accountName.startsWith("@")
    ? accountName
    : `@${accountName}`;

  // A direct mention search is simply the @username.
  // We can combine it with other options using buildTwitterQuery.
  // If allWords is already set, we append. Otherwise, we set it.
  let baseQuery = formattedAccount;
  if (options.allWords) {
    baseQuery = `${options.allWords} ${formattedAccount}`;
  }

  return buildTwitterQuery({
    ...options,
    allWords: baseQuery, // Ensure the mention is part of the query
  });
}
