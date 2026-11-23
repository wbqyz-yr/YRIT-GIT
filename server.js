"use strict";

// 五子棋桌面启动器：启动一个本地 HTTP 服务托管游戏静态文件，
// 并自动打开默认浏览器。由 @yao-pkg/pkg 打包为单个可执行文件。
const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const GAME_DIR = path.join(__dirname, "gomoku-game");

const ROUTES = {
  "/": "index.html",
  "/index.html": "index.html",
  "/style.css": "style.css",
  "/game.js": "game.js",
};

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

const server = http.createServer((req, res) => {
  const urlPath = (req.url || "/").split("?")[0];
  const file = ROUTES[urlPath];
  if (!file) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
    return;
  }
  fs.readFile(path.join(GAME_DIR, file), (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Internal Server Error");
      return;
    }
    const ext = path.extname(file);
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
    });
    res.end(data);
  });
});

function openBrowser(url) {
  let cmd;
  if (process.platform === "win32") cmd = `start "" "${url}"`;
  else if (process.platform === "darwin") cmd = `open "${url}"`;
  else cmd = `xdg-open "${url}"`;
  exec(cmd, (err) => {
    if (err) console.log("请手动在浏览器打开: " + url);
  });
}

server.listen(0, "127.0.0.1", () => {
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}/`;
  console.log("五子棋游戏已启动: " + url);
  openBrowser(url);
  console.log("关闭此窗口即可退出游戏。");
});
