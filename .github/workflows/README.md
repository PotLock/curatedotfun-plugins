# 🔄 Service Sync Workflows

> Automate syncing service directories to deployment repositories

## 📋 Overview

This repository contains a reusable GitHub Actions workflow for syncing service directories to deployment repositories. The workflow is designed to be flexible and can be used with any service directory and target repository.

## 🚀 Getting Started

### Reusable Workflow Template

The `sync-service-template.yml` workflow handles:

- ✅ Validating source directory exists
- 🔄 Cloning target repository
- 🌱 Creating target branch if needed
- 📂 Syncing directory contents
- 🚢 Committing and pushing changes

### Usage

Create a new workflow file for your service (e.g. `sync-your-service.yml`):

```yaml
name: Sync Your Service
on:
  push:
    paths:
      - 'path/to/your/service/**'
    branches:
      - main

jobs:
  sync-service:
    uses: ./.github/workflows/sync-service-template.yml
    with:
      source_path: path/to/your/service
      target_repo: org/deployment-repo-name
      target_branch: main  # optional, defaults to main
    secrets:
      deploy_token: ${{ secrets.YOUR_DEPLOY_TOKEN }}
```

## 🔑 Setting Up Deploy Keys

For each target repository, set up a deploy key for secure repository access. Deploy keys are SSH keys that grant access to a single repository. See the [GitHub documentation on deploy keys](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys#deploy-keys) for more information.

### 1. Generate an SSH Key Pair

Generate a new SSH key pair specifically for this deployment:

```bash
ssh-keygen -t ed25519 -C "your_email@example.com" -f deploy_key_filename
```

This creates:

- `deploy_key_filename` (private key)
- `deploy_key_filename.pub` (public key)

When prompted for a passphrase, press Enter to create a key without a passphrase (since it will be used in automated workflows).

To display the public key so you can copy it:

```bash
# On macOS/Linux
cat deploy_key_filename.pub

# On Windows (PowerShell)
Get-Content deploy_key_filename.pub
```

For more detailed instructions on generating SSH keys, see [GitHub's documentation on generating a new SSH key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent#generating-a-new-ssh-key).

> **Security Note**: Always create a unique key for each repository. Never reuse SSH keys across different repositories or purposes.

### 2. Add the Public Key to the Target Repository

- Go to the target repository on GitHub
- Navigate to Settings > Deploy keys
- Click "Add deploy key"
- Title: Give it a descriptive name (e.g. "Service Sync Deploy Key")
- Key: Paste the contents of `deploy_key_filename.pub`
- ✅ Check "Allow write access" if the workflow needs to push changes
- Click "Add key"

### 3. Add the Private Key as a Repository Secret

- Go to your source repository's Settings > Secrets and variables > Actions
- Click "New repository secret"
- Name: Use a descriptive name (e.g. `RSS_DEPLOY_TOKEN`)
- Value: Paste the contents of the `deploy_key_filename` file
- Click "Add secret"

### 4. Use the Deploy Key in Your Workflow

The workflow template in this repository is already configured to use SSH deploy keys. The `sync-service-template.yml` workflow:

1. Uses the [webfactory/ssh-agent](https://github.com/webfactory/ssh-agent) action to securely install the SSH key
2. Automatically handles SSH authentication for git operations
3. Uses SSH for git clone and push operations

No additional modifications are needed to use deploy keys with this workflow.

## 📊 Example: RSS Service

The RSS service workflow (`sync-rss-service.yml`) demonstrates how to use the template:

```yaml
name: Sync RSS Service
on:
  push:
    paths:
      - 'packages/rss/service/**'
    branches:
      - main

jobs:
  sync-rss:
    uses: ./.github/workflows/sync-service-template.yml
    with:
      source_path: packages/rss/service
      target_repo: curatedotfun/rss-service-template
      target_branch: main
    secrets:
      deploy_token: ${{ secrets.RSS_DEPLOY_TOKEN }}
```

## 🔒 Security Best Practices

1. **Repository-Specific Keys**: Use a unique deploy key for each target repository.

2. **Minimal Permissions**: Configure deploy keys with read-only access when possible.

3. **Key Rotation**: Regularly rotate your deploy keys for better security.

4. **Branch Protection**: Enable branch protection rules on target repositories to ensure changes follow your workflow.

## ❓ Troubleshooting

If the workflow fails, check:

1. **Source Path**: Ensure the source directory exists and contains the files you want to sync.

2. **Deploy Key**: Verify the key has the correct permissions and is properly configured.

3. **Target Repository**: Confirm the repository exists and is accessible with the provided key.

4. **SSH Configuration**: Check if the SSH configuration in the workflow is correct.

5. **Branch Access**: Verify there are no branch protection rules preventing pushes.
