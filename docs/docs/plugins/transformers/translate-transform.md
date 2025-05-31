---
sidebar_position: 5
---

# 🌐 Translate Transform Plugin

The Translate Transform plugin enables automatic content translation using DeepL's translation API, supporting multiple languages and preserving formatting.

## 🔧 Setup Guide

1. Define the plugin in your `curate.config.json`:

   ```json
   {
     "plugins": {
       "@curatedotfun/translate-transform": {
         "type": "transformer",
         "url": "https://unpkg.com/@curatedotfun/translate-transform@latest/dist/remoteEntry.js"
       }
     }
   }
   ```

2. Add the transformer to a feed's output stream or recap:

   ```json
   {
     "feeds": [
       {
         "id": "your-feed",
         "outputs": {
           "stream": {
             "enabled": true,
             "transform": {
               "plugin": "@curatedotfun/translate-transform",
               "config": {
                 "apiKey": "{DEEPL_API_KEY}",
                 "targetLang": "EN-US",
                 // Optional: Specify source language
                 "sourceLang": "DE",
                 // Optional: Preserve formatting (defaults to true)
                 "preserveFormatting": true
               }
             },
             "distribute": [
               // Your distributors here
             ]
           }
         }
       }
     ]
   }
   ```

   :::info
   The `{DEEPL_API_KEY}` has already been configured in the deployed environment and will get injected at runtime.
   :::

## Features

### Configuration Options

- `apiKey` (required): DeepL API key for authentication
- `targetLang` (required): Target language code (e.g., "EN-US", "DE", "FR")
- `sourceLang` (optional): Source language code (e.g., "EN", "DE", "FR")
- `preserveFormatting` (optional): Whether to preserve formatting in the translated text (defaults to true)

### Supported Languages

DeepL supports translation between the following languages:

- Bulgarian (BG)
- Czech (CS)
- Danish (DA)
- German (DE)
- Greek (EL)
- English (EN)
- Spanish (ES)
- Estonian (ET)
- Finnish (FI)
- French (FR)
- Hungarian (HU)
- Indonesian (ID)
- Italian (IT)
- Japanese (JA)
- Korean (KO)
- Lithuanian (LT)
- Latvian (LV)
- Norwegian (NB)
- Dutch (NL)
- Polish (PL)
- Portuguese (PT)
- Romanian (RO)
- Russian (RU)
- Slovak (SK)
- Slovenian (SL)
- Swedish (SV)
- Turkish (TR)
- Ukrainian (UK)
- Chinese (ZH)

### Usage Examples

#### 1. Basic Translation

```json
{
  "transform": {
    "plugin": "@curatedotfun/translate-transform",
    "config": {
      "apiKey": "{DEEPL_API_KEY}",
      "targetLang": "EN-US"
    }
  }
}
```

#### 2. Translation with Source Language

```json
{
  "transform": {
    "plugin": "@curatedotfun/translate-transform",
    "config": {
      "apiKey": "{DEEPL_API_KEY}",
      "sourceLang": "DE",
      "targetLang": "EN-US",
      "preserveFormatting": true
    }
  }
}
```

:::tip
Best Practices:

- Always specify the source language when you know it for better translation quality
- Use `preserveFormatting: true` when translating formatted text (HTML, markdown, etc.)
- Consider the character limits of your DeepL API plan
- For large texts, consider splitting them into smaller chunks before translation

:::

## Error Handling

The plugin handles various error cases:

- Missing API key
- Missing target language
- Invalid input format
- Translation service errors
- Network issues

All errors are caught and wrapped with descriptive messages to help with debugging. 