## Why

当前项目是标准的 electron-vite + 单 Renderer 架构。目标是改造为插件化系统：每个插件是一个独立的前端项目（React/Vue 等），以独立 BrowserWindow 运行，支持安装/卸载，且插件不打包进 asar，由主进程从外置目录加载。

## What Changes

- **目录重构**：从单包转为 pnpm monorepo（core + 多个 plugin 包）
- **PluginManager**：主进程新增插件管理器，负责扫描、加载、打开/关闭/安装/卸载插件
- **插件协议**：每个插件通过 `plugin.config.json` 声明元数据（名称、窗口尺寸、dev 端口）
- **Host UI**：主窗口改为插件管理中心，展示插件列表，支持打开/关闭/卸载操作
- **插件构建**：插件使用纯 Vite（非 electron-vite）构建，产物输出到共享目录 `plugin-dev-output/`
- **nodeIntegration**：插件窗口启用 `nodeIntegration: true / contextIsolation: false`
- **开发模式**：`pnpm dev` 同时启动 Electron 和所有插件的 Vite DevServer，支持 HMR
- **生产分发**：插件通过 `electron-builder extraResources` 外置到 `resources/plugins/`

## Capabilities

### New Capabilities
- `plugin-discovery`: 主进程扫描外置插件目录，读取 plugin.config.json，返回可用插件列表
- `plugin-lifecycle`: 插件的安装、卸载、打开、关闭状态管理
- `plugin-host-ui`: 主窗口的插件管理中心 UI（列表、状态、操作按钮）
- `plugin-communication`: 插件窗口与主进程之间的 IPC 协议

### Modified Capabilities

- 无（本项目为新项目起点，不修改已有能力）

## Impact

- **项目结构**：从单一包 → pnpm monorepo（`packages/core`, `packages/plugin-*`）
- **构建流程**：Core 沿用 electron-vite 构建；插件改用纯 vite 构建
- **依赖**：新增 `concurrently`（或 pnpm parallel）用于并行 dev 启动
- **分发**：electron-builder.yml 新增 `extraResources` 携带插件产物
- **运行模式**：dev 模式下插件走 DevServer（HMR），生产走 file:// 加载
