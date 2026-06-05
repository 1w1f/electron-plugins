## 1. Core - 实现 Dev 模式插件发现机制

- [x] 1.1 在 `plugin-manager.ts` 中添加 `scanPluginDirs()` 方法，扫描 `packages/plugin-*/rspack.config.ts` 提取 `devServer.port`
- [x] 1.2 在 `plugin-manager.ts` 中添加 `fetchPluginInfo(port: number)` 方法，请求 `/__plugin-info` 获取插件元数据和路径
- [x] 1.3 实现 `discoverDev()` 方法，串联扫描和拉取流程，返回 `PluginMeta[]`
- [x] 1.4 修改 `discover()` 方法，dev 模式下调用 `discoverDev()` 代替文件扫描
- [x] 1.5 更新 `PluginConfig` 类型，`devPort` 改为可选字段

## 2. Plugin A - 添加 /__plugin-info 端点

- [x] 2.1 在 `rspack.config.ts` 的 frontend 配置中添加 `devServer.setupMiddlewares`，注册 `GET /__plugin-info` 端点
- [x] 2.2 `/__plugin-info` 返回插件名称、配置、窗口设置、`configPath`（指向源码目录的 `plugin.config.json`）和 `backendPath`（指向编译产物的 `backend.js`）

## 3. Plugin B - 添加 /__plugin-info 端点

- [x] 3.1 在 `rspack.config.ts` 的 frontend 配置中添加 `devServer.setupMiddlewares`，注册 `GET /__plugin-info` 端点
- [x] 3.2 `/__plugin-info` 返回插件名称、配置、窗口设置、`configPath` 和 `backendPath`

## 4. 清理配置文件

- [x] 4.1 Plugin A: 从 `plugin.config.json` 中删除 `devPort` 字段
- [x] 4.2 Plugin B: 从 `plugin.config.json` 中删除 `devPort` 字段
- [x] 4.3 Plugin A: 从 `package.json` 中删除 `postbuild` 脚本，添加 `dev:backend` 脚本
- [x] 4.4 Plugin B: 从 `package.json` 中删除 `postbuild` 脚本，添加 `dev:backend` 脚本

## 5. 验证

- [x] 5.1 启动 plugin-a 的 dev server + backend watch，确认 `/__plugin-info` 返回正确数据
- [x] 5.2 启动 plugin-b 的 dev server + backend watch，确认 `/__plugin-info` 返回正确数据
- [x] 5.3 模拟全流程：扫描 → fetch → 读 config → 确认 backend 路径，全部通过
- [x] 5.4 检查代码：`is.dev` 分支保护了 production 逻辑，生产路径完全不变
