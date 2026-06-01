## Context

插件系统目前架构：PluginManager 管理插件生命周期，每个插件仅有一个 BrowserWindow 渲染前端 SPA（Vite + React）。插件无法访问主进程的 Node.js 能力（fs、数据库、child_process 等）。

需要将构建从 Vite 迁移到 Rspack，同时引入后端脚本机制。Rspack 原生支持数组配置，同一个 config 文件可以输出两个产物——前端（web target）和后端（node target），比 Vite 更直接。

## Goals / Non-Goals

**Goals:**
- 插件构建工具从 Vite 切换到 Rspack，保留 HMR / React Fast Refresh 开发体验
- 每个插件可提供 `src/backend.ts`，构建产物 `<plugin-dir>/backend.js`
- PluginManager 在 `discover()` 阶段扫描到 `plugin.config.json` 中 `backend` 字段时，`import()` 加载后端模块并执行 `activate()`
- 后端脚本通过 Electron IPC（`ipcMain.handle`）提供能力，前端通过 `ipcRenderer.invoke` 调用
- 两个插件（plugin-a, plugin-b）同时迁移

**Non-Goals:**
- 后端热重载（后端文件变更后自动 reload）—— 后续迭代
- 后端脚本沙箱隔离 —— 目前直接 `import()` 加载，运行在主进程上下文
- Core 自身的构建工具迁移 —— core 保持 electron-vite

## Decisions

### 1. Rspack 数组 Config 代替 Vite 单 Config

| 方案 | 结果 |
|------|------|
| Vite 单 config + rollupOptions.input 拆两个 entry | 两个 entry 共享 target/plugins，不好隔离前后端差异 |
| **Rspack 数组 config** ✅ | 每个 config 独立 target、plugins、externals，干净分离 |

Rspack 数组 config 允许每个元素声明独立的 `name`、`target`、`output`、`plugins`、`externals`。构建时通过 `--config-name frontend` / `--config-name backend` 分别构建，或直接 `rspack build` 一次构建全部。

### 2. Backend Script 使用 ESM 格式

后端输出 `library: { type: 'module' }` + `experiments: { outputModule: true }`，主进程通过 `import()` 加载。选择 ESM 而非 CJS 的原因：

- 插件项目 `package.json` 已声明 `"type": "module"`
- `import()` 异步加载，不阻塞主进程启动
- 未来方便做模块缓存清理（`import()` URL 加 query string 绕缓存）

### 3. PluginManager 在 discover() 阶段加载后端

选择在 `discover()` （应用启动扫描插件时）加载而非窗口打开时加载：

- 后端脚本可能需要在窗口打开前就开始工作（后台任务、数据预热）
- 与插件窗口生命周期解耦，窗口关闭后后端仍可运行
- 如果某个 backend 加载失败，不影响其他插件和核心启动

### 4. electron 和 Node 内置模块全部 external

后端 bundle 不打包 `electron` 和 Node.js 内置模块，保留为运行时 import，避免打包体积膨胀和模块实例冲突：

```typescript
externals: {
  electron: 'commonjs electron',
  ...builtinModules.reduce((acc, mod) => ({ ...acc, [mod]: `commonjs ${mod}` }), {})
}
```

### 5. Rspack dev server

前端开发使用 `@rspack/dev-server`，配置 `hot: true` + ReactRefreshPlugin，保留类似 Vite 的 HMR 开发体验。后端开发时仅做一次构建，dev server 不涉及后端。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| Rspack dev server HMR 速度不如 Vite（Rspack 是全量编译） | 对于小型插件项目，差异可接受 |
| backend 脚本不做热重载，开发时需要手动重启主进程 | 显式列为 non-goal，后续迭代 |
| Rspack 生态不如 Vite 成熟（plugin 数量少） | 插件项目使用场景有限（React + TS），Rspack 已完整覆盖 |
| electron-vite 的兼容性 | 只改插件构建，core 不动，electron-vite 不受影响 |
| `import()` 后模块缓存导致重复加载问题 | 暂不处理，确认是已知问题，后续通过 URL query string 或 `delete require.cache` 解决 |
