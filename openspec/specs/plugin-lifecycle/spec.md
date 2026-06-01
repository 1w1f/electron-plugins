## ADDED Requirements

### Requirement: Open plugin window
The system SHALL create a new BrowserWindow for a plugin and load its entry point (dev server URL in dev mode, file path in production).

#### Scenario: Open plugin in dev mode
- **WHEN** user triggers open on a plugin
- **WHEN** running in dev mode
- **THEN** PluginManager SHALL create a BrowserWindow with `nodeIntegration: true` and `contextIsolation: false`
- **THEN** the window SHALL load `http://localhost:<devPort>`
- **THEN** the plugin status SHALL change to "opened"

#### Scenario: Open plugin in production mode
- **WHEN** user triggers open on a plugin
- **WHEN** running in production mode
- **THEN** PluginManager SHALL create a BrowserWindow
- **THEN** the window SHALL load `file://<pluginsDir>/<name>/index.html`
- **THEN** the plugin status SHALL change to "opened"

#### Scenario: Dev server unavailable fallback
- **WHEN** running in dev mode
- **WHEN** the dev server is not reachable
- **THEN** PluginManager SHALL fall back to loading the production file path

### Requirement: Close plugin window
The system SHALL close a plugin's BrowserWindow and update its status.

#### Scenario: Close opened plugin
- **WHEN** user triggers close on an opened plugin
- **THEN** the BrowserWindow SHALL be closed
- **THEN** the plugin status SHALL change to "closed"

### Requirement: Install plugin
The system SHALL add a plugin to the available list by scanning a specified plugin directory name.

#### Scenario: Install a plugin by name
- **WHEN** user provides a plugin directory name
- **THEN** PluginManager SHALL scan `<pluginsDir>/<name>/` for `plugin.config.json`
- **THEN** if valid, the plugin SHALL be added to the plugin list
- **THEN** the renderer SHALL be notified of the updated list

#### Scenario: Install non-existent plugin
- **WHEN** user provides a plugin directory name that doesn't exist
- **THEN** PluginManager SHALL return an error message

### Requirement: Uninstall plugin
The system SHALL remove a plugin from the available list and close its window if open.

#### Scenario: Uninstall a plugin
- **WHEN** user triggers uninstall on a plugin
- **THEN** if the plugin window is open, it SHALL be closed first
- **THEN** the plugin SHALL be removed from the list
- **THEN** the renderer SHALL be notified of the updated list
