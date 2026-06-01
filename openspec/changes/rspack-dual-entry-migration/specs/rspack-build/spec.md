## ADDED Requirements

### Requirement: Plugin build uses Rspack with array config

Each plugin SHALL use Rspack as its build tool, configured via `rspack.config.ts` at the plugin root directory. The config SHALL be an array with two configurations:

- `config[0]` ("frontend"): target `web`, builds the React SPA
- `config[1]` ("backend"): target `node`, builds the backend script

#### Scenario: Build frontend entry
- **WHEN** running `rspack build --config-name frontend` in the plugin directory
- **THEN** Rspack SHALL output bundled frontend assets to `<outDir>/assets/main-<hash>.js`
- **THEN** Rspack SHALL generate `<outDir>/index.html` with the script tag auto-injected

#### Scenario: Build backend entry
- **WHEN** running `rspack build --config-name backend` in the plugin directory
- **THEN** Rspack SHALL output `<outDir>/backend.js` as an ES module

#### Scenario: Full build
- **WHEN** running `rspack build` in the plugin directory
- **THEN** both frontend and backend SHALL be built sequentially

### Requirement: Frontend build uses React with HMR

The frontend Rspack config SHALL support React development with Hot Module Replacement.

- SHALL use `@rspack/plugin-react-refresh` for React Fast Refresh
- SHALL use `HtmlRspackPlugin` for HTML generation
- SHALL output files to `plugin-dev-output/<plugin-name>/`
- Dev server SHALL run on the port specified in `plugin.config.json` (`devPort`)

#### Scenario: Dev server starts with HMR
- **WHEN** running `rspack dev --config-name frontend` in the plugin directory
- **THEN** Rspack dev server SHALL start on the configured port
- **THEN** HMR websocket SHALL be available

### Requirement: Backend build externalizes electron and Node modules

The backend Rspack config SHALL mark the following as external (not bundled):

- `electron`
- All Node.js built-in modules (`fs`, `path`, `os`, `child_process`, `crypto`, etc.)

#### Scenario: Backend bundle does not contain electron
- **WHEN** inspecting the built `backend.js`
- **THEN** it SHALL contain `import { ipcMain } from 'electron'` as an external import, NOT bundled inline

### Requirement: Build output directory structure

The build output for each plugin SHALL follow this structure:

```
plugin-dev-output/<plugin-name>/
├── index.html                 ← from HtmlRspackPlugin
├── assets/
│   └── main-<contenthash>.js  ← frontend bundle
├── backend.js                 ← backend bundle (if exists)
└── plugin.config.json         ← copied from source
```

#### Scenario: Output structure
- **WHEN** running `rspack build` for a plugin with both frontend and backend
- **THEN** all the above files SHALL exist in the output directory
