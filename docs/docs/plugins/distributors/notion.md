---
sidebar_position: 2
---

# 📝 Notion Plugin

The Notion plugin enables distribution of content to a Notion database. It accepts any object structure and automatically formats the values based on their types to match Notion's property formats.

## 🔧 Setup Guide

1. Create a Notion integration:
   - Go to [Notion Integrations](https://www.notion.so/my-integrations)
   - Create a new integration
   - Copy the "Internal Integration Token"

2. Create and share a database:
   - Create a new database in Notion
   - Share it with your integration via the "..." menu → "Add connections"
   - Copy the database ID from the URL (the `<long_hash_1>` in `https://www.notion.so/<long_hash_1>?v=<long_hash_2>`)

## 📝 Usage with Object Transform

The Notion plugin works seamlessly with the Object Transform plugin to map your data into the desired structure. For example:

```json
{
  "transform": {
    "plugin": "@curatedotfun/object-transform",
    "config": {
      "mappings": {
        "title": "{{title}} by {{author}}",
        "url": "{{source}}",
        "tags": "[{{categories}}]",
        "published": "{{createdAt}}"
      }
    }
  },
  "distribute": [
    {
      "plugin": "@curatedotfun/notion",
      "config": {
        "token": "your_integration_token",
        "databaseId": "your_database_id",
        "fields": {
          "title": "title",
          "url": "url",
          "tags": "multi_select",
          "published": "date"
        }
      }
    }
  ]
}
```

By default, the Notion plugin will automatically format each property based on its value type:

- **Strings** → Rich Text
- **Dates** (or date strings) → Date
- **Numbers** → Number
- **Booleans** → Checkbox
- **Arrays** → Multi-select
- **Other types** → Rich Text (converted to string)

Although you should explicitly specify the field types using the `fields` configuration option (see below).

:::tip
Design your database schema to match your transformed object structure. The plugin will create pages with properties matching your object's field names.
:::

## 📝 Configuration Reference

You need to specify:

- `token`: Notion Internal Integration Token
- `databaseId`: Your database ID extracted from the URL
- `fields`: A mapping of field names to Notion property types

```json
{
  "plugin": "@curatedotfun/notion",
  "config": {
    "token": "secret_...", // Your Notion integration token
    "databaseId": "...", // Your Notion database ID
    "fields": {
      "title": "title",
      "description": "rich_text",
      "date": "date",
      "count": "number",
      "isPublished": "checkbox",
      "tags": "multi_select",
      "category": "select",
      "website": "url",
      "email": "email",
      "phone": "phone"
    }
  }
}
```

### Supported Property Types

The `fields` configuration allows you to explicitly specify how each field should be formatted in Notion. This gives you precise control over the data types and ensures your content is properly formatted in your Notion database.

For more information about Notion database properties, see the [Notion Database Properties documentation](https://www.notion.com/help/database-properties).

The following property types are supported:

| Property Type | Description |
|---------------|-------------|
| `title` | The main title of the page. Each page requires exactly one title property. |
| `rich_text` | Formatted text content that can include styling. |
| `date` | A date or date range value. |
| `number` | A numeric value. |
| `checkbox` | A boolean (true/false) value. |
| `multi_select` | Multiple tags or categories from a predefined list. |
| `select` | A single option from a predefined list. |
| `url` | A web address link. |
| `email` | An email address. |
| `phone` | A phone number. |
