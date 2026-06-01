## Context

当前项目是一个标准的 electron-vite 脚手架（React + TypeScript），单 main process + 单 preload + 单 renderer 结构。需要改造为插件化架构：多个插件以独立 BrowserWindow 运行，每个插件是独立的 Vite 前端项目，不打包进 asar，由主进程从外置目录加载。

项目使用 pnpm workspace，已配置 electron-builder 打包。

## Goals / Non-Goals

**Goals:**
- 实现 pnpm monorepo 结构：`packages/core`（Electron 主应用）+ `packages/plugin-*`（独立 Vite 项目）
- PluginManager 主进程模块：扫描外置目录、加载插件配置、创建/关闭窗口
- Host UI：主窗口改造成插件管理中心（列表、打开/关闭、安装/卸载）
- 插件协议：`plugin.config.json` 声明元数据
- 开发模式：pnpm --parallel 同时启动 Electron + 多个 Vite DevServer，插件 HMR
- 生产分发：插件通过 electron-builder extraResources 外置到 resources/plugins/

**Non-Goals:**
- 插件独立分发/动态下载（不在本次范围）
- 插件间通信（刻意不做，保持隔离）
- 插件配置持久化（不做 electron-store 等）
- 自定义 preload 脚本（所有插件用相同 preload 或不用 preload）
- 权限模型（nodeIntegration = true，不限制能力）

## Decisions

### 1. Monorepo 结构 vs 多目录

**决定**：pnpm workspace monorepo，`packages/` 下统一管理 core 和 plugins。

- pnpm workspace 已配置，直接扩展
- 统一 `pnpm dev` / `pnpm build` 命令
- 插件源码与构建产物分离：源码在 `packages/plugin-*`，产物输出到根 `plugin-dev-output/`

### 2. nodeIntegration: true / contextIsolation: false

**决定**：插件窗口启用 Node.js 集成，关闭上下文隔离。

- 插件本身需要完整 Node.js 能力（直接 require fs/path 等）
- 简化 IPC 模型，插件可以直接用 Node API
- 风险：插件可访问全部 Node API → 但插件属于受信代码（和 app 一起开发）

### 3. 纯 Vite 构建插件（非 electron-vite）

**决定**：插件使用标准 Vite（@vitejs/plugin-react 等），不经过 electron-vite。

- 插件不需要 electron-vite 的 main/preload/renderer 三阶段构建
- 插件是纯前端项目，产出 html + js + css
- 插件作者可以用任意框架（React/Vue/Svelte），只要 vite 能构建
- 产物输出到 workspace 根 `plugin-dev-output/<name>/`

### 4. 固定端口约定

**决定**：每个插件在 `plugin.config.json` 中声明固定 devPort，无动态分配。

- 实现简单，不依赖端口协商逻辑
- 插件作者自行管理端口不冲突
- 约定：plugin-a → 5173, plugin-b → 5174, plugin-c → 5175 ...

### 5. 插件安装/卸载的语义

**决定**：install/uninstall 仅管理 PluginManager 内存状态，不操作文件系统。

- Install：扫描指定目录名加载 plugin.config.json，加入可用列表
- Uninstall：从列表中移除，若窗口已打开则先关闭
- 文件系统操作（创建/删除目录）由开发者手动完成

### 6. Host UI 定位

**决定**：主窗口（core renderer）改造为插件管理中心，而不是插件的容器。

- 主窗口显示插件列表、状态、操作按钮
- 不嵌入插件内容（插件在独立窗口打开）
- 主窗口本身不依赖插件即可独立工作

## Risks / Trade-offs

- **[安全风险]** nodeIntegration: true → 插件可执行任意 Node 代码。**缓解**：插件与主应用一起开发，属于受信代码
- **[端口冲突]** 固定端口可能被其他进程占用。**缓解**：dev 模式先尝试 fetch 检测端口可用性
- **[构建一致性]** 每个插件独立 vite 构建，可能因插件版本不一致导致构建失败。**缓解**：统一使用 workspace 根依赖版本
- **[调试复杂度]** 同时运行 Electron + 多个 Vite DevServer，调试时可能端口混杂。**缓解**：vite 终端日志自带颜色和端口标识
