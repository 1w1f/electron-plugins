## ADDED Requirements

### Requirement: Scan plugin directory
The system SHALL scan a predefined plugin output directory for available plugins by reading their `plugin.config.json` files.

#### Scenario: Discover plugins from directory
- **WHEN** PluginManager.scan() is called
- **THEN** it reads all subdirectories under the plugin output directory
- **THEN** for each subdirectory containing a valid `plugin.config.json`, it parses and registers the plugin metadata

#### Scenario: Skip invalid plugin directories
- **WHEN** a subdirectory exists but contains no `plugin.config.json` or the file is malformed
- **THEN** that subdirectory SHALL be silently skipped

#### Scenario: Return plugin list to renderer
- **WHEN** Host UI sends `pm:list` IPC request
- **THEN** PluginManager SHALL return all currently discovered PluginMeta objects

### Requirement: Plugin config format
The system SHALL read plugin metadata from a `plugin.config.json` file in each plugin's output directory.

#### Scenario: Valid plugin.config.json
- **WHEN** PluginManager reads a valid `plugin.config.json`
- **THEN** it extracts `name`, `displayName`, `version`, `devPort`, and `window` config
- **THEN** the plugin SHALL be registered as available

#### Scenario: Missing required fields
- **WHEN** `plugin.config.json` is missing required fields (name, displayName, devPort)
- **THEN** the plugin SHALL be skipped with a console warning
