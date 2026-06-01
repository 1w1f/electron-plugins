## 1. Core 侧改动

- [x] 1.1 `plugin-types.ts` 新增 `BackendModule` 类型
- [x] 1.2 `plugin-manager.ts` 新增 `loadBackend()` 方法
- [x] 1.3 `plugin-manager.ts` 修改 `discover()` 扫描到 `backend` 字段时调用 `loadBackend()`
- [x] 1.4 `plugin-manager.ts` 修改 `uninstall()` 时调用 `deactivate()` 清理

## 2. Root 依赖安装

- [x] 2.1 在 workspace root 或各插件添加 `@rspack/core`、`@rspack/cli`、`@rspack/plugin-react-refresh`、`@rspack/dev-server` 依赖
- [x] 2.2 运行 `pnpm install` 安装依赖
- [x] 2.3 根目录 `pnpm-workspace.yaml` 确认插件包路径已包含

## 3. Plugin-a 迁移

- [x] 3.1 删除 `packages/plugin-a/vite.config.ts`
- [x] 3.2 新建 `packages/plugin-a/rspack.config.ts`（数组 config：frontend + backend）
- [x] 3.3 新建 `packages/plugin-a/src/backend.ts`（导出 `activate` / `deactivate`）
- [x] 3.4 修改 `packages/plugin-a/index.html`（去掉 script 标签，HtmlRspackPlugin 自动注入）
- [x] 3.5 修改 `packages/plugin-a/plugin.config.json`（新增 `"backend": "backend.js"`）
- [x] 3.6 修改 `packages/plugin-a/package.json`（移除 vite 依赖，添加 rspack 依赖，更新 scripts）
- [x] 3.7 构建验证：`rspack build` 输出产物到 `plugin-dev-output/plugin-a/`

## 4. Plugin-b 迁移

- [x] 4.1 删除 `packages/plugin-b/vite.config.ts`
- [x] 4.2 新建 `packages/plugin-b/rspack.config.ts`（数组 config：frontend + backend）
- [x] 4.3 新建 `packages/plugin-b/src/backend.ts`（导出 `activate` / `deactivate`）
- [x] 4.4 修改 `packages/plugin-b/index.html`（去掉 script 标签，HtmlRspackPlugin 自动注入）
- [x] 4.5 修改 `packages/plugin-b/plugin.config.json`（新增 `"backend": "backend.js"`）
- [x] 4.6 修改 `packages/plugin-b/package.json`（移除 vite 依赖，添加 rspack 依赖，更新 scripts）
- [x] 4.7 构建验证：`rspack build` 输出产物到 `plugin-dev-output/plugin-b/`

## 5. 集成验证

- [x] 5.1 跑 `pnpm build` 确认所有包构建成功
- [ ] 5.2 启动 core app，确认插件列表正常加载
- [ ] 5.3 打开 plugin-a，确认前端渲染正常
- [ ] 5.4 验证 plugin-a backend 脚本被加载，IPC 通信正常
- [ ] 5.5 打开 plugin-b，确认前端渲染正常
- [ ] 5.6 验证 plugin-b backend 脚本被加载，IPC 通信正常
- [ ] 5.7 验证插件卸载时 `deactivate()` 被调用
