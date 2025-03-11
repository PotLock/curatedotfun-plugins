---
sidebar_position: 2
---

# 🚀 Deployment

Deploy your curate.fun instance to production ⚡

## 🌥️ Deploying to Fly.io

The backend service can be deployed to Fly.io with SQLite support.

### 📋 Prerequisites

Install the Fly CLI:

```bash
# 🍎 macOS
brew install flyctl

# 🪟 Windows
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# 🐧 Linux
curl -L https://fly.io/install.sh | sh
```

### 🔑 Authentication

Sign up and authenticate with Fly.io:

```bash
fly auth signup
# or
fly auth login
```

### 🛫 Deployment Steps

1. 🎬 Initialize your Fly.io application:

```bash
bun run deploy:init
```

This will:

- 📦 Create the Fly App
- 💾 Set up LiteFS volume ([LiteFS Speedrun](https://fly.io/docs/litefs/speedrun/))
- 🔄 Attach Consul for LiteFS cluster management

2. ⚙️ Configure environment variables:

```bash
# 🐦 Twitter Authentication
fly secrets set TWITTER_USERNAME=your_twitter_username
fly secrets set TWITTER_PASSWORD=your_twitter_password
fly secrets set TWITTER_EMAIL=your_twitter_email

# 📢 Distribution Services
fly secrets set TELEGRAM_BOT_TOKEN=your_bot_token
fly secrets set TELEGRAM_CHANNEL_ID=your_channel_id
```

3. 🚀 Deploy the application:

```bash
bun run deploy
```

### 🏗️ Architecture

- ✨ Distributed SQLite using LiteFS
- 🔄 Automatic file replication across instances
- 🎯 Primary/replica configuration using Consul
- 🔒 HTTPS enabled by default

#### 🔍 Details

- 📍 Primary instance (LAX region) handles write operations
- 🔄 Replicas automatically sync data from primary
- 🎛️ Consul manages primary/replica coordination
- ⚡ Automatic failover if primary becomes unavailable

#### 📁 Key Files

- `fly.toml`: Main Fly.io configuration
- `litefs.yml`: LiteFS configuration
- `Dockerfile`: Container and LiteFS setup

### 📊 Monitoring

Monitor your deployment:

```bash
# 👀 View deployment status
fly status

# 📝 View logs
fly logs

# 🖥️ Access dashboard
fly dashboard
```

### 🔧 Troubleshooting

Common issues and solutions:

1. **🗄️ Container issues**

   ```bash
   # Explore container
   fly ssh console
   
   # Verify Consul
   fly consul status
   
   # Check status
   fly logs
   ```

3. **💻 Scale up or downtown**

   ```bash
   # Increase count (# is number of machines)
   fly scale count #
   
   # Check distribution
   fly scale show
   ```

📚 For more help:

- [Fly.io Documentation](https://fly.io/docs/)
- [Community Discord](https://fly.io/discord)
