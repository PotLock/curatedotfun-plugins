---
sidebar_position: 2
---

# 🚀 Deployment

Deploy your curate.fun instance to production ⚡

## 🚂 Deploying to Railway

The backend service can be deployed to Railway using their built-in Postgres service.

### 📋 Prerequisites

- A [Railway](https://railway.app/) account
- A GitHub account (optional, for CI/CD setup)

### 🚀 Quick Deployment

The fastest way to deploy is using the Railway template:

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/RiUi5U?referralCode=3O4l1-)

You can also access the template directly at: https://railway.com/template/RiUi5U?referralCode=3O4l1-

### ⚙️ Configuration

After deploying the template, you'll need to configure the following environment variables in the Railway dashboard:

#### Required Environment Variables

- `TWITTER_USERNAME`: Your Twitter username
- `TWITTER_PASSWORD`: Your Twitter password
- `TWITTER_EMAIL`: Your Twitter email
- `TWITTER_2FA`: Your Twitter 2FA code

#### Optional Environment Variables

- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token (required for the [Telegram plugin](../plugins/distributors/telegram.md))
- `OPENROUTER_API_KEY`: Your OpenRouter API key (required for the [AI Transform plugin](../plugins/transformers/ai-transform.md))

### 🔧 Customization

You'll need to customize your `curate.config.json` file to match your specific curation needs. See the [configuration documentation](./configuration.md) for details on how to set up your configuration.

### 🔧 Troubleshooting

Common issues and solutions:

1. **Database Connection Issues**
   - Verify that the Postgres service is properly linked to your application
   - Check the connection string in the environment variables (should be shared environemnt variable ${{ Postgres.DATABASE_URL }})

2. **Twitter Authentication Problems**
   - Ensure all Twitter credentials are correctly set in the environment variables
   - If locked out, use Twitter cookies instead

3. **Deployment Failures**
   - Check the deployment logs in the Railway dashboard
   - Verify that your repository has the correct structure and dependencies

📚 For more help:

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord Community](https://discord.com/invite/railway)
