## ADDED Requirements

### Requirement: Plugin provides backend script

A plugin MAY provide a Node.js backend script that runs in the Electron main process. The backend script SHALL be built from `src/backend.ts` to `<plugin-dir>/backend.js`.

- The backend script SHALL export an `activate` function accepting `(pluginName: string)`
- The backend script MAY export a `deactivate` function for cleanup
- `activate` SHALL be called by PluginManager during the `discover()` phase
- `deactivate` SHALL be called by PluginManager when the plugin is uninstalled

#### Scenario: Backend script exists and is loaded
- **WHEN** PluginManager scans plugin directory and `plugin.config.json` declares `"backend": "backend.js"`
- **THEN** PluginManager SHALL `import()` the backend module and call `activate(pluginName)`

#### Scenario: Backend script does not exist
- **WHEN** PluginManager scans plugin directory and `plugin.config.json` does NOT contain a `backend` field
- **THEN** PluginManager SHALL skip backend loading without error

#### Scenario: Backend script export function missing
- **WHEN** PluginManager loads a backend module that has no `activate` export
- **THEN** PluginManager SHALL log a warning and continue, not crash

### Requirement: Backend script registers IPC handlers

The backend script MAY register IPC handlers via Electron's `ipcMain.handle()` during `activate()`.

- IPC channel names SHOULD follow the convention `plugin-{name}:{action}` to avoid conflicts
- The backend script SHALL clean up IPC handlers in `deactivate()` if needed

#### Scenario: Frontend calls backend via IPC
- **WHEN** Plugin frontend calls `window.ipcRenderer.invoke('plugin-a:query-data', params)`
- **THEN** The backend script's `ipcMain.handle('plugin-a:query-data', handler)` SHALL receive and process the call
- **THEN** The frontend SHALL receive the response from the handler

### Requirement: Backend script has access to Node.js APIs

The backend script SHALL have full access to Node.js built-in modules (`fs`, `path`, `child_process`, etc.) and Electron APIs at runtime.

- These modules SHALL NOT be bundled by Rspack — they SHALL remain as external dependencies
- The `electron` package SHALL also remain external

#### Scenario: Backend uses Node.js fs module
- **WHEN** The backend script calls `import { readFile } from 'fs/promises'`
- **THEN** The call SHALL succeed at runtime with the actual Node.js `fs` module

### Requirement: PluginManager loads backend on discover

PluginManager SHALL attempt to load the backend script during the `discover()` phase, after parsing `plugin.config.json`.

- Backend loading SHALL NOT block the plugin discovery flow — use Promise and log errors
- If backend loading throws, PluginManager SHALL catch the error and continue

#### Scenario: Backend load failure is non-fatal
- **WHEN** A backend script throws during `import()` or `activate()`
- **THEN** PluginManager SHALL catch the error, log it, and continue loading other plugins

### Requirement: Backend cleanup on plugin uninstall

When a plugin is uninstalled, PluginManager SHALL call `deactivate()` on the backend module if it exists.

#### Scenario: Uninstall calls deactivate
- **WHEN** User clicks uninstall on a plugin that has a loaded backend
- **THEN** PluginManager SHALL call `mod.deactivate()` before removing the plugin
