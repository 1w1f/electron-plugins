## Why

当前开发模式下，core 依赖 `plugin-dev-output/` 目录下的 `plugin.config.json` 来发现和加载插件，这需要每次修改配置后通过 `postbuild` 脚本复制文件。开发流程繁琐：改配置 → build → 复制 → 重启 core。同时 `devPort` 在 `plugin.config.json` 和 `rspack.config.ts` 两处维护，容易不一致。

## What Changes

- **插件发现机制变更（dev 模式）**: Core 不再扫描 `plugin-dev-output/`，改为扫描 `packages/plugin-*/rspack.config.ts` 提取 `devServer.port` 来发现插件
- **新增 `/__plugin-info` 端点**: 每个插件的 rspack dev server 暴露 `GET /__plugin-info`，返回插件配置信息和编译产物路径
- **删除 `devPort` 冗余定义**: `plugin.config.json` 中移除 `devPort` 字段，端口只保留在 `rspack.config.ts`
- **删除 `postbuild` 脚本**: 不再需要复制 `plugin.config.json` 到 `plugin-dev-output/`
- **新增 `dev:backend` 脚本**: 添加 `rspack build --config-name backend --watch` 用于开发时持续编译后端模块
- **`PluginManager.discover()` 增加 dev 分支**: dev 模式下通过 HTTP 获取插件信息，production 模式逻辑不变

## Capabilities

### New Capabilities
- `plugin-discovery-dev`: 开发模式下 core 自动发现插件并获取配置/后端模块的机制

### Modified Capabilities

（无）

## Impact

- `packages/core/src/main/plugin-manager.ts`: `discover()` 增加 dev 模式分支，不再依赖本地文件
- `packages/plugin-a/rspack.config.ts` 及 `packages/plugin-b/rspack.config.ts`: 添加 `devServer.setupMiddlewares` 注册 `/__plugin-info` 端点
- `packages/plugin-a/plugin.config.json` 及 `packages/plugin-b/plugin.config.json`: 删除 `devPort` 字段
- `packages/plugin-a/package.json` 及 `packages/plugin-b/package.json`: 删除 `postbuild`，新增 `dev:backend` 脚本
