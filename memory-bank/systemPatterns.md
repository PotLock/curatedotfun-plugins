# System Patterns: curate.fun Plugins

## System Architecture

The curate.fun plugins system follows a modular, plugin-based architecture that enables extensibility and flexibility. The core architecture consists of the following components:

1. **Plugin Interfaces**: Standardized TypeScript interfaces that define the contract for different types of plugins.
2. **Plugin Registry**: A mechanism for registering and discovering available plugins.
3. **Plugin Manager**: A development tool for testing and managing plugins.
4. **Plugin Implementations**: Individual packages implementing the plugin interfaces.

The system is organized as a monorepo using Turborepo for efficient builds and dependency management, with the following structure:

```
curatedotfun-plugins/
├── apps/
│   └── example/           # Plugin manager development tool
├── packages/
│   ├── types/             # Core type definitions
│   ├── utils/             # Shared utilities
│   └── [plugin-packages]/ # Individual plugin implementations
```

## Key Technical Decisions

1. **TypeScript for Type Safety**: The project uses TypeScript to provide strong typing and better developer experience, ensuring that plugins adhere to the expected interfaces.

2. **Monorepo Structure**: A monorepo approach using Turborepo allows for efficient dependency management, shared configurations, and simplified versioning across multiple packages.

3. **Plugin Interface Design**: Plugins are categorized into two main types:
   - **Transformer Plugins**: Convert content from one format to another
   - **Distributor Plugins**: Send content to external platforms or services

4. **Lifecycle Management**: Plugins follow a consistent lifecycle with initialize, operation (transform/distribute), and shutdown phases.

5. **Configuration Approach**: Plugins accept configuration during initialization, allowing for flexible customization without modifying the plugin code.

6. **Error Handling Strategy**: Standardized error handling patterns ensure that errors are properly caught, typed, and reported.

7. **Bun as Runtime and Package Manager**: The project uses Bun for its speed and modern JavaScript/TypeScript support.

## Design Patterns in Use

1. **Plugin Pattern**: The core architectural pattern, allowing for extensibility through standardized interfaces.

2. **Factory Pattern**: Used in the plugin registry to create instances of plugins based on their type and configuration.

3. **Dependency Injection**: Configuration and dependencies are injected into plugins during initialization.

4. **Strategy Pattern**: Different plugins implement different strategies for transformation or distribution while adhering to the same interface.

5. **Adapter Pattern**: Many plugins serve as adapters between the curate.fun system and external services or APIs.

6. **Builder Pattern**: Used in some plugins to construct complex output formats (like RSS feeds) from simpler input data.

7. **Singleton Pattern**: Used for service connections to ensure efficient resource usage.

## Component Relationships

### Core Components

1. **Plugin Interfaces (packages/types)**:
   - Defines the contract that all plugins must implement
   - Provides type definitions for plugin configuration and operations

2. **Plugin Manager (apps/example)**:
   - Provides a UI for managing and testing plugins
   - Handles plugin registration and configuration
   - Facilitates testing of transform and distribute operations

3. **Utility Functions (packages/utils)**:
   - Provides shared functionality used across multiple plugins
   - Implements common patterns for error handling, validation, etc.

### Plugin Types

1. **Transformer Plugins**:
   - Implement the `TransformerPlugin` interface
   - Accept input data and configuration
   - Return transformed output data
   - Examples: simple-transform, ai-transform, object-transform

2. **Distributor Plugins**:
   - Implement the `DistributorPlugin` interface
   - Accept input data and configuration
   - Distribute the data to external services
   - Examples: rss, telegram, near-social

### Data Flow

1. **Transformation Flow**:
   ```
   Input Data → Transformer Plugin → Transformed Output
   ```

2. **Distribution Flow**:
   ```
   Input Data → Distributor Plugin → External Service
   ```

3. **Combined Flow**:
   ```
   Input Data → Transformer Plugin → Transformed Output → Distributor Plugin → External Service
   ```

## Integration Patterns

1. **Service Integration**:
   - Plugins connect to external services via their APIs
   - Authentication is handled through configuration
   - Service-specific error handling is encapsulated within the plugin

2. **Plugin Composition**:
   - Plugins can be chained together to create workflows
   - Output from one plugin can be used as input for another

3. **Environment Variable Integration**:
   - Sensitive configuration (API keys, tokens) is provided via environment variables
   - The plugin manager automatically hydrates these variables in plugin configurations

## Testing Patterns

1. **Unit Testing**:
   - Individual plugin functionality is tested in isolation
   - Mock objects are used to simulate external dependencies

2. **Integration Testing**:
   - End-to-end testing of plugin chains
   - Verification of correct interaction with external services (where possible)

3. **Manual Testing via Plugin Manager**:
   - The plugin manager provides a UI for manual testing
   - Allows for real-time verification of plugin behavior
