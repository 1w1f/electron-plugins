## ADDED Requirements

### Requirement: IPC channel definitions
The system SHALL define a set of IPC channels for Host UI ↔ PluginManager communication.

#### Scenario: IPC channels are registered
- **WHEN** the main process starts
- **THEN** `ipcMain.handle('pm:list')` SHALL be registered
- **THEN** `ipcMain.handle('pm:open')` SHALL be registered
- **THEN** `ipcMain.handle('pm:close')` SHALL be registered
- **THEN** `ipcMain.handle('pm:install')` SHALL be registered
- **THEN** `ipcMain.handle('pm:uninstall')` SHALL be registered

### Requirement: Plugin status push notification
The system SHALL push plugin status changes to the Host UI renderer.

#### Scenario: Status change notification
- **WHEN** a plugin status changes (opened/closed)
- **THEN** PluginManager SHALL send `pm:status-changed` to the Host UI renderer
- **THEN** the Host UI SHALL update the corresponding plugin's status badge

### Requirement: Preload API exposure
The Host UI SHALL access plugin management APIs through the preload script.

#### Scenario: Preload exposes plugin API
- **WHEN** the preload script executes
- **THEN** it SHALL expose `window.electronAPI.plugin.*` methods via contextBridge
- **THEN** the exposed methods SHALL map to the corresponding IPC invoke calls
