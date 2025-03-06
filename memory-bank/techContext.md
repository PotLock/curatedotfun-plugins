# Technical Context: curate.fun Plugins

## Technologies Used

### Core Technologies

1. **TypeScript**: The primary programming language used throughout the project for its strong typing and modern JavaScript features.

2. **Bun**: Used as both the package manager and runtime environment, chosen for its speed and modern JavaScript/TypeScript support.

3. **Turborepo**: Monorepo management tool that optimizes the build system and manages dependencies across packages.

4. **Module Federation**: Used for dynamic loading of plugins at runtime without requiring installation.

### Build & Development Tools

1. **Rspack**: A Rust-based bundler used for building the plugins, providing faster build times compared to webpack.

2. **Prettier**: Code formatter used to maintain consistent code style across the project.

3. **ESLint**: Static code analysis tool used to identify problematic patterns in the code.

### Testing Tools

1. **Jest/Bun Test**: Used for unit and integration testing of plugins.

2. **Example App**: A development tool for manual testing and management of plugins.

### External Service Integrations

Various plugins integrate with external services, including:

1. **RSS**: For generating and consuming RSS feeds
2. **Telegram**: For distributing content to Telegram channels
3. **NEAR Social**: For interacting with the NEAR blockchain social platform
4. **Notion**: For integrating with Notion databases and pages
5. **Supabase**: For database operations and storage
6. **AI Services**: For content transformation using AI models

## Development Setup

### Prerequisites

1. **Bun**: Required for package management and running the project
2. **Node.js**: Required for some tooling that may not yet be compatible with Bun

### Local Development Environment

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/potlock/curatedotfun-plugins.git
   cd curatedotfun-plugins
   ```

2. **Install Dependencies**:
   ```bash
   bun install
   ```

3. **Development Mode**:
   ```bash
   # Run all plugins and example plugin manager
   bun run dev

   # Run specific plugins
   bun run dev --filter=@curatedotfun/plugin-name
   ```

4. **Building**:
   ```bash
   # Build all plugins
   bun run build

   # Build a specific plugin
   bun run build --filter=@curatedotfun/plugin-name
   ```

### Plugin Development Workflow

1. Create a new plugin package in the `packages/` directory
2. Implement the appropriate plugin interface (transformer or distributor)
3. Add the plugin to the development registry in the example app
4. Test the plugin using the example app
5. Build and publish the plugin

## Technical Constraints

1. **TypeScript Compatibility**: All code must be written in TypeScript and adhere to the project's TypeScript configuration.

2. **Plugin Interface Compliance**: Plugins must implement the standardized interfaces defined in the `types` package.

3. **Error Handling**: Plugins must handle errors gracefully and provide meaningful error messages.

4. **Asynchronous Operations**: All plugin operations (initialize, transform, distribute, shutdown) must be asynchronous and return Promises.

5. **Configuration Validation**: Plugins should validate their configuration during initialization.

6. **Resource Management**: Plugins should properly manage resources and clean up during shutdown.

7. **Cross-Platform Compatibility**: Plugins should work across different operating systems and environments.

## Dependencies

### Core Dependencies

1. **@types/node**: TypeScript definitions for Node.js
2. **prettier**: Code formatting
3. **turbo**: Monorepo management

### Plugin-Specific Dependencies

Different plugins have their own specific dependencies based on their functionality:

1. **simple-transform**:
   - Mustache: For template-based transformations

2. **rss**:
   - zod: For schema validation
   - Various RSS-related libraries for feed generation and parsing

3. **telegram**:
   - Telegram Bot API libraries

4. **near-social**:
   - NEAR API libraries for blockchain interaction

5. **notion**:
   - Notion API client

6. **supabase**:
   - Supabase client libraries

7. **ai-transform**:
   - AI service client libraries

## Deployment Considerations

1. **Plugin Publishing**: Plugins are published as standalone npm packages that can be installed and used in any project.

2. **Service Dependencies**: Some plugins require external services to be running (e.g., the RSS plugin requires an RSS service).

3. **Environment Variables**: Sensitive configuration like API keys should be provided through environment variables.

4. **Versioning**: Plugins follow semantic versioning to indicate breaking changes, new features, and bug fixes.

5. **Documentation**: Each plugin should include documentation on its usage, configuration options, and any required external services.

## Performance Considerations

1. **Lazy Loading**: Plugins are loaded dynamically only when needed to minimize startup time.

2. **Resource Efficiency**: Plugins should minimize resource usage, especially for long-running operations.

3. **Caching**: Where appropriate, plugins should implement caching to improve performance.

4. **Error Recovery**: Plugins should be designed to recover from transient errors when possible.

## Security Considerations

1. **Input Validation**: All plugin inputs should be validated to prevent security issues.

2. **Secure Handling of Credentials**: API keys and other credentials should be handled securely.

3. **Content Sanitization**: Content should be sanitized when appropriate to prevent XSS and other injection attacks.

4. **Rate Limiting**: Plugins should implement rate limiting when interacting with external APIs to prevent abuse.
