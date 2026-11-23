# 五子棋 (Gomoku)

一个纯前端、无依赖的五子棋小游戏。15×15 标准棋盘，支持双人对战和人机对战。

## 运行方式

### 1. 在线游玩（无需安装）

直接打开 GitHub Pages 链接：

https://wbqyz-yr.github.io/YRIT-GIT/gomoku-game/

### 2. 桌面版（Windows EXE，双击即玩）

从 [Releases](https://github.com/wbqyz-yr/YRIT-GIT/releases) 下载 `gomoku-win-x64.exe`，双击运行后会自动打开浏览器进入游戏。

> 构建方式：`npm install && npm run build:win`，产物在 `dist/`。启动器逻辑见 `server.js`。

### 3. 直接打开网页文件

用浏览器打开 `gomoku-game/index.html` 即可，无需安装任何依赖：

```bash
# 或使用任意静态服务器
python3 -m http.server 8000
# 然后访问 http://localhost:8000/gomoku-game
```

## 功能

- **双人对战**：两名玩家轮流落子。
- **人机对战**：可选电脑执黑或电脑执白，电脑会主动进攻并防守。
- **悔棋**：撤销一步（人机模式下会一次撤回双方各一手）。
- **胜负判定**：先连成五子者胜，高亮获胜连线。
- **重新开始**：随时重置棋盘。

## 文件结构

| 文件                        | 说明                         |
| --------------------------- | ---------------------------- |
| `gomoku-game/index.html`    | 页面结构                     |
| `gomoku-game/style.css`     | 样式                         |
| `gomoku-game/game.js`       | 游戏逻辑与 AI                |
| `gomoku-game/screenshots/*.png` | 界面截图                 |
| `server.js`                 | 桌面版启动器（本地服务 + 打开浏览器） |
| `package.json`              | 桌面版打包配置               |
