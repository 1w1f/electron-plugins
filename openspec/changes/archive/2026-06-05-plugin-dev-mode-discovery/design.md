## Context

当前插件开发模式下，core 通过 `plugin-dev-output/<plugin-name>/plugin.config.json` 发现插件。这个文件由 `postbuild` 脚本从源码目录复制过来，导致修改配置需要重新 build。同时 `devPort` 在 `rspack.config.ts` 和 `plugin.config.json` 中重复定义，容易不一致。

项目是 monorepo 结构，插件统一放在 `packages/plugin-*` 目录下，使用 rspack 构建，前端通过 dev server 提供 HMR 能力。

## Goals / Non-Goals

**Goals:**
- 消除 dev 模式下 core 对 `plugin-dev-output/` 目录的文件依赖
- 消除 `devPort` 在 `rspack.config.ts` 和 `plugin.config.json` 中的重复定义
- core 在 dev 模式下能动态获取插件配置和编译产物路径
- `PluginManager` 的业务逻辑（open/close/list/install/uninstall）不做改动

**Non-Goals:**
- 不改变 production 模式的插件加载方式
- 不改变 `plugin.config.json` 的格式定义（只删除 `devPort`）
- 不实现后端模块的热重载（hot-reload）

## Decisions

### 1. 插件发现方式：扫描 rspack.config.ts 提取 devServer.port

core 通过扫描 `packages/plugin-*/rspack.config.ts`，用正则提取 `devServer.port` 值，从而知道每个插件的 dev server 端口。

- **理由**: 端口只在一个地方维护（rspack config），消除重复
- **替代方案**: 在 `plugin.config.json` 中保留 `devPort` → 引入重复定义
- **替代方案**: 约定固定端口映射（plugin-a=5173, plugin-b=5174） → 不够灵活
- **正则提取的风险**: 如果 rspack config 格式变化较大可能失效，但当前结构稳定，且只影响 dev 模式

### 2. 元数据获取方式：dev server 暴露 /__plugin-info 端点

每个插件的 rspack dev server 添加 `setupMiddlewares`，注册 `GET /__plugin-info` 端点，返回插件元数据。

- **返回内容**:
  ```json
  {
    "name": "plugin-a",
    "displayName": "数据仪表盘",
    "version": "1.0.0",
    "window": { "width": 1000, "height": 700, "minWidth": 600, "minHeight": 400, "title": "数据仪表盘" },
    "configPath": "C:/abs/path/to/plugin.config.json",
    "backendPath": "C:/abs/path/to/plugin-dev-output/plugin-a/backend.js"
  }
  ```
- **理由**: dev server 已在运行，可以准确知道自己的源码路径和编译产物路径
- **configPath**: 指向源码目录中的 `plugin.config.json`，core 直接读取
- **backendPath**: 指向 rspack build --watch 持续编译输出的 `backend.js`

### 3. PluginManager.discover() 增加 dev 分支

```typescript
discover(): PluginMeta[] {
  if (is.dev) {
    return this.discoverDev()
  }
  // 原有 production 逻辑不变
  ...
}

private discoverDev(): PluginMeta[] {
  // 1. 扫描 packages/plugin-*/rspack.config.ts 获取端口
  // 2. 逐一请求 /__plugin-info
  // 3. 读取 configPath 获取完整配置
  // 4. 加载 backendPath
  // 5. 注册插件
}
```

- **理由**: 不影响 production 逻辑，改动局部化
- **backend 加载时机**: 在 discoverDev 中完成，和生产模式一致

### 4. 删除 postbuild，新增 dev:backend 脚本

`postbuild` 不再需要。新增 `dev:backend` 脚本用 `--watch` 模式持续编译后端模块。

### 5. 启动顺序约定

先启动插件的 dev server + backend watch，再启动 core。如果 core 启动时 dev server 未就绪，对应插件不会出现在列表中，core 不做自动重试（简化处理）。

## Risks / Trade-offs

- **[正则解析脆弱]** rspack config 格式变化可能导致端口提取失败 → 影响范围仅限于 dev 模式，且容易发现和修复
- **[冷启动顺序]** core 启动时 dev server 还没就绪 → 插件不会出现。用户需要先启动插件 dev server 再启动 core，或手动刷新
- **[Windows 路径兼容]** backendPath 返回的是文件系统路径，跨平台时需确保路径分隔符正确 → 统一用 `path.resolve()` 生成正斜杠路径
- **[后端不热重载]** 修改 backend 源码后需要重启 core 才能生效 → 这是现有限制，不在本次范围
