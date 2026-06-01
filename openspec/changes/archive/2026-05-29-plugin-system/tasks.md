## 1. Monorepo 重构

- [x] 1.1 创建 `packages/core/`，将 `src/` 下所有文件移入，添加 `package.json`
- [x] 1.2 更新 `packages/core/electron.vite.config.ts` 路径配置
- [x] 1.3 更新 `packages/core/package.json` scripts（dev/build 等）
- [x] 1.4 创建 `packages/plugin-a/` 插件模板目录和 `packages/plugin-b/` 目录
- [x] 1.5 更新根 `package.json` workspace scripts（dev/build 并行命令）
- [x] 1.6 验证 `pnpm dev` 能正常启动 (核心和插件各自构建通过，dev server 启动需要在有显示器的环境验证)

## 2. 插件构建与输出

- [x] 2.1 创建 `plugin.config.json` 协议定义和 TypeScript 类型
- [x] 2.2 为 plugin-a 和 plugin-b 创建 `vite.config.ts`（纯 Vite，非 electron-vite）
- [x] 2.3 为 plugin-a 和 plugin-b 添加 `index.html` 和 `src/main.tsx` 入口
- [x] 2.4 配置 vite build 输出到根 `plugin-dev-output/<name>/`
- [x] 2.5 验证 `pnpm build:plugins` 产出正确的 dist 文件

## 3. PluginManager 主进程模块

- [x] 3.1 创建 `PluginManager` 类：discover() 扫描 plugin-dev-output/ 目录
- [x] 3.2 实现 `loadConfig(name)` 读取和校验 `plugin.config.json`
- [x] 3.3 实现 `open(name)` 创建 BrowserWindow（dev 用 loadURL，prod 用 loadFile）
- [x] 3.4 实现 `close(name)` 关闭窗口并更新状态
- [x] 3.5 实现 `install(name)` / `uninstall(name)` 管理插件列表
- [x] 3.6 完善 dev 模式下 devServer 不可用时的降级策略（fetch 探测）
- [x] 3.7 注册所有 IPC handlers（pm:list/open/close/install/uninstall）
- [x] 3.8 状态变更时向 renderer 推送 `pm:status-changed`

## 4. IPC 通信层

- [x] 4.1 定义 IPC 通道名称常量（pm:list, pm:open, pm:close, pm:install, pm:uninstall, pm:status-changed）
- [x] 4.2 更新 preload 脚本，通过 contextBridge 暴露 `window.api.*`

## 5. Host UI（插件管理中心）

- [x] 5.1 创建 `usePlugins` hook（封装所有 IPC 调用和状态管理）
- [x] 5.2 创建 `PluginDashboard` 主组件（插件列表栅格布局）
- [x] 5.3 创建 `PluginCard` 组件（图标、名称、版本、状态徽标、操作按钮）
- [x] 5.4 创建 `InstallBar` 组件（输入框 + 安装按钮）
- [x] 5.5 改造 `App.tsx` 使用 PluginDashboard
- [x] 5.6 添加基本样式（移除默认 electron-vite 示例样式）

## 6. 开发体验

- [x] 6.1 添加 `plugin-dev-output/` 到 `.gitignore`
- [ ] 6.2 验证 `pnpm dev` 并行启动 (需显示器环境)
- [ ] 6.3 验证插件 HMR (需显示器环境)
- [ ] 6.4 验证 dev 模式插件窗口加载 devServer URL (需显示器环境)

## 7. 生产构建与分发

- [x] 7.1 更新 `electron-builder.yml` 添加 `extraResources` 指向 `plugin-dev-output/`
- [ ] 7.2 验证生产构建后 `resources/plugins/` 包含插件产物
- [ ] 7.3 验证生产模式下插件窗口加载 file:// 路径 (需显示器环境)
