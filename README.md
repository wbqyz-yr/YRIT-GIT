# YRIT-GIT

superagent POC playground

## 五子棋 (Gomoku)

一个纯前端、无依赖的五子棋小游戏。15×15 标准棋盘，支持双人对战和人机对战。

### 运行方式

- **网页直接打开**：用浏览器打开 [`gomoku-game/index.html`](gomoku-game/index.html)，无需安装任何依赖。
- **桌面版（Windows EXE，双击即玩）**：从 [Releases](https://github.com/wbqyz-yr/YRIT-GIT/releases) 下载 `gomoku-win-x64.exe`，双击运行后自动打开浏览器进入游戏（本地 HTTP 服务 + 自动开浏览器，逻辑见 `main.go`）。
- **本地服务**：`python3 -m http.server 8000` 后访问 `http://localhost:8000/gomoku-game`。

### 桌面版构建

桌面版是一个 Go 启动器，用 `embed` 内嵌游戏静态文件，启动本地 HTTP 服务并自动打开浏览器，交叉编译为单个 Windows 可执行文件（约 5 MB，无任何运行时依赖）：

```bash
# 需要 Go 1.22+
# Windows 版
GOOS=windows GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o dist/gomoku-win-x64.exe .
# Linux 版（本机冒烟测试用）
go build -o dist/gomoku-linux-x64 .
```

### 文件结构

| 文件                        | 说明                         |
| --------------------------- | ---------------------------- |
| `gomoku-game/index.html`    | 页面结构                     |
| `gomoku-game/style.css`     | 样式                         |
| `gomoku-game/game.js`       | 游戏逻辑与 AI                |
| `gomoku-game/screenshots/*.png` | 界面截图                 |
| `main.go`                   | 桌面版启动器（本地服务 + 打开浏览器） |
| `go.mod`                    | Go 模块定义                  |
