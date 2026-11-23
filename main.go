// 五子棋桌面启动器：内嵌游戏静态文件，启动一个本地 HTTP 服务，
// 并自动打开默认浏览器。可交叉编译为单个 Windows 可执行文件。
package main

import (
	"embed"
	"fmt"
	"log"
	"net"
	"net/http"
	"os/exec"
	"path"
	"runtime"
	"strings"
)

//go:embed gomoku-game/index.html gomoku-game/style.css gomoku-game/game.js
var content embed.FS

var routes = map[string]string{
	"/":           "gomoku-game/index.html",
	"/index.html": "gomoku-game/index.html",
	"/style.css":  "gomoku-game/style.css",
	"/game.js":    "gomoku-game/game.js",
}

var mime = map[string]string{
	".html": "text/html; charset=utf-8",
	".css":  "text/css; charset=utf-8",
	".js":   "text/javascript; charset=utf-8",
}

func handle(w http.ResponseWriter, r *http.Request) {
	file, ok := routes[r.URL.Path]
	if !ok {
		http.NotFound(w, r)
		return
	}
	data, err := content.ReadFile(file)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	ct := mime[path.Ext(file)]
	if ct == "" {
		ct = "application/octet-stream"
	}
	w.Header().Set("Content-Type", ct)
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}

func openBrowser(url string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", "", url)
	case "darwin":
		cmd = exec.Command("open", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	if err := cmd.Start(); err != nil {
		fmt.Println("请手动在浏览器打开: " + url)
	}
}

func main() {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatalf("启动本地服务失败: %v", err)
	}
	port := listener.Addr().(*net.TCPAddr).Port
	url := fmt.Sprintf("http://127.0.0.1:%d/", port)

	go func() {
		if err := http.Serve(listener, http.HandlerFunc(handle)); err != nil {
			log.Printf("服务异常退出: %v", err)
		}
	}()

	fmt.Println(strings.Repeat("=", 40))
	fmt.Println("五子棋游戏已启动: " + url)
	fmt.Println("浏览器会自动打开，如未打开请手动复制上面的地址。")
	fmt.Println("关闭此窗口即可退出游戏。")
	fmt.Println(strings.Repeat("=", 40))
	openBrowser(url)

	select {}
}
