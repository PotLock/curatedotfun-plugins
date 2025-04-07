---
sidebar_position: 2
---

# 🚀 Deployment

Deploy your curate.fun instance to production ⚡

## 🚂 Deploying to Railway (Recommended)

The backend service can be deployed to Railway using their built-in Postgres service. This service also serves the frontend dashboard.

### 📋 Prerequisites

- A [Railway](https://railway.app/) account
- A GitHub account (optional, for CI/CD setup)

### 🚀 Quick Deployment

The fastest way to deploy is using the Railway template:

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/RiUi5U?referralCode=3O4l1-)

You can also access the template directly at: <https://railway.com/template/RiUi5U?referralCode=3O4l1->

### ⚙️ Configuration

After deploying the template, you'll need to configure the following environment variables in the Railway dashboard:

#### Required Environment Variables

- `TWITTER_USERNAME`: Your Twitter username.
- `TWITTER_PASSWORD`: Your Twitter password.
- `TWITTER_EMAIL`: Your Twitter email.
- `TWITTER_2FA`: Your Twitter 2FA code.

#### Optional Environment Variables

- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token (required for the [Telegram plugin](../plugins/distributors/telegram.md)).
- `OPENROUTER_API_KEY`: Your OpenRouter API key (required for the [AI Transform plugin](../plugins/transformers/ai-transform.md)).

### 🔧 Customization

You'll need to customize your `curate.config.json` file to match your specific curation needs. See the [configuration documentation](./configuration.md) for details on how to set up your configuration.

### 🔧 Troubleshooting

Common issues and solutions:

1. **Database Connection Issues**
   - Verify that the Postgres service is properly linked to your application
   - Check the connection string in the environment variables (`DATABASE_URL` should be a shared environment variable `${{ Postgres.DATABASE_URL }}`)

2. **Twitter Authentication Problems**
   - Ensure all Twitter credentials are correctly set in the environment variables
   - If locked out, use Twitter cookies instead

3. **Deployment Failures**
   - Check the deployment logs in the Railway dashboard
   - Verify that your repository has the correct structure and dependencies

📚 For more help:

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord Community](https://discord.com/invite/railway)

## 🐳 Alternative Deployment Options

### Using Docker with External Postgres

You can deploy the application using the [Dockerfile](https://github.com/PotLock/curatedotfun/blob/main/Dockerfile) and connect it to your own Postgres database:

1. **Build the Docker image**:

   ```bash
   docker build -t curatedotfun .
   ```

2. **Run the container with environment variables**:

   ```bash
   docker run -d \
     -p 3000:3000 \
     -e DATABASE_URL=postgres://username:password@host:port/database \
     -e TWITTER_USERNAME=your_twitter_username \
     -e TWITTER_PASSWORD=your_twitter_password \
     -e TWITTER_EMAIL=your_twitter_email \
     -e TWITTER_2FA=your_twitter_2fa \
     --name curatedotfun \
     curatedotfun
   ```

This approach works with any hosting provider that supports Docker containers, such as [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform), [AWS App Runner](https://aws.amazon.com/apprunner/), [Google Cloud Run](https://cloud.google.com/run), or [Azure Container Instances](https://azure.microsoft.com/en-us/products/container-instances).
