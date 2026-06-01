## Why

插件目前只有前端 SPA（BrowserWindow 里的 React 应用），无法访问 Node.js API 或在主进程运行代码。这限制了插件的功能范围——操作文件系统、数据库、后台任务等能力都缺失。同时 Vite 的多入口构建对前后端分离的支持不够直接。需要将构建工具迁移到 Rspack，并引入后端脚本机制让插件拥有完整的 Node.js 能力。

## What Changes

- **构建工具迁移**：插件（plugin-a, plugin-b）从 Vite 迁移到 Rspack，使用 Rspack 数组 config 同时构建前端（web target）和后端（node target）
- **新增后端脚本机制**：每个插件可提供 `src/backend.ts`，构建为 `backend.js`，PluginManager 在 `discover()` 阶段 `import()` 加载并调用 `activate()`
- **新增 `plugin.config.json` `backend` 字段**：声明后端脚本入口路径，例如 `"backend": "backend.js"`
- **IPC 通信**：后端脚本通过 `ipcMain.handle()` 注册通道，插件前端通过 `ipcRenderer.invoke()` 调用，走标准 Electron IPC
- **Rspack dev server**：替代 Vite dev server，保留 HMR / React Fast Refresh
- **后端热重载**：暂不处理，后续迭代

## Capabilities

### New Capabilities
- `plugin-backend-script`: 插件提供 Node.js 后端脚本，在主进程中运行，通过 IPC 与插件前端通信
- `rspack-build`: 插件使用 Rspack 构建，支持前端 + 后端双入口

### Modified Capabilities

无。当前没有已存在的 OpenSpec specs，这是初始引入。

## Impact

- **packages/plugin-a/**: 删除 vite.config.ts + 相关依赖，新增 rspack.config.ts + src/backend.ts，修改 index.html / package.json / plugin.config.json
- **packages/plugin-b/**: 同上
- **packages/core/src/main/**: plugin-types.ts 新增 BackendModule 类型，plugin-manager.ts 新增 loadBackend() 逻辑
- **依赖项**: 各插件 package.json 移除 vite / @vitejs/plugin-react，新增 @rspack/core / @rspack/cli / @rspack/plugin-react-refresh
