## ADDED Requirements

### Requirement: Core discovers plugins by scanning monorepo plugin directories

In dev mode, the system SHALL discover available plugins by scanning `packages/plugin-*` directories relative to the monorepo root, rather than reading from `plugin-dev-output/`.

#### Scenario: Core scans packages/plugin-* directories for rspack configs
- **WHEN** `PluginManager.discover()` is called in dev mode
- **THEN** the system SHALL list all directories matching `packages/plugin-*`
- **AND** for each directory, read `rspack.config.ts` to extract `devServer.port`

#### Scenario: Port extraction from rspack.config.ts
- **WHEN** reading a plugin's `rspack.config.ts`
- **THEN** the system SHALL extract the `devServer.port` value using pattern matching
- **AND** use the extracted port to construct the dev server URL

#### Scenario: No rspack.config.ts found
- **WHEN** a `packages/plugin-*` directory does not contain `rspack.config.ts`
- **THEN** the system SHALL skip that directory silently

#### Scenario: No devServer.port found in rspack.config.ts
- **WHEN** `rspack.config.ts` exists but no `devServer.port` is found
- **THEN** the system SHALL log a warning and skip that plugin

### Requirement: Dev server exposes /__plugin-info endpoint

Each plugin's rspack dev server SHALL expose a `GET /__plugin-info` endpoint that returns plugin metadata and file paths.

#### Scenario: Successful response from /__plugin-info
- **WHEN** core sends a GET request to `http://localhost:<port>/__plugin-info`
- **THEN** the dev server SHALL return HTTP 200 with JSON body containing:
  - `name`: plugin name (string)
  - `displayName`: display name (string)
  - `version`: version string (string)
  - `window`: window configuration object
  - `configPath`: absolute filesystem path to `plugin.config.json` (string)
  - `backendPath`: absolute filesystem path to compiled `backend.js` (string)

#### Scenario: /__plugin-info is served after dev server starts
- **WHEN** rspack dev server is running
- **THEN** `GET /__plugin-info` SHALL be available immediately, before any frontend compilation

#### Scenario: /__plugin-info endpoint only available in dev mode
- **WHEN** the plugin is built for production
- **THEN** there SHALL be no `/__plugin-info` endpoint in the production bundle

### Requirement: Core fetches /__plugin-info to get plugin metadata

In dev mode, `PluginManager.discover()` SHALL fetch each discovered plugin's `/__plugin-info` endpoint to obtain metadata and module paths.

#### Scenario: Core receives valid response from /__plugin-info
- **WHEN** `GET /__plugin-info` returns HTTP 200 with valid JSON
- **THEN** the system SHALL read `plugin.config.json` from the returned `configPath`
- **AND** load the backend module from the returned `backendPath` via `import()`
- **AND** register the plugin with full metadata

#### Scenario: Dev server is not reachable
- **WHEN** `GET /__plugin-info` fails (connection refused, timeout, or non-200 response)
- **THEN** the system SHALL log a warning with the plugin name and port
- **AND** skip that plugin without crashing

#### Scenario: configPath file does not exist
- **WHEN** `configPath` from `/__plugin-info` points to a non-existent file
- **THEN** the system SHALL log a warning
- **AND** skip that plugin

#### Scenario: backendPath file does not exist
- **WHEN** `backendPath` from `/__plugin-info` points to a non-existent file
- **THEN** the system SHALL log a warning
- **AND** register the plugin without backend module (frontend-only)

### Requirement: Backend module compiles via watch mode

Each plugin SHALL provide a `dev:backend` npm script that compiles the backend module in watch mode.

#### Scenario: dev:backend is run
- **WHEN** `npm run dev:backend` is executed in a plugin directory
- **THEN** rspack SHALL compile the backend entry with `--config-name backend --watch`
- **AND** output `backend.js` to `plugin-dev-output/<plugin-name>/backend.js`

### Requirement: plugin.config.json no longer contains devPort

The `devPort` field SHALL be removed from `plugin.config.json`. The port SHALL only exist in `rspack.config.ts`.

#### Scenario: plugin.config.json without devPort
- **WHEN** `plugin.config.json` is parsed
- **THEN** the system SHALL NOT require `devPort` to be present
- **AND** `PluginConfig` type SHALL make `devPort` optional

### Requirement: postbuild script is removed

The `postbuild` script that copies `plugin.config.json` to `plugin-dev-output/` SHALL be removed from each plugin's `package.json`.

#### Scenario: Build completes without postbuild
- **WHEN** `npm run build` is executed in a plugin directory
- **THEN** the build SHALL complete without attempting to copy `plugin.config.json`
